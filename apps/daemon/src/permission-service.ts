import http from 'node:http';
import { access } from 'node:fs/promises';
import {
  createPermissionHandler,
  isFilePermissionRequest as coreIsFilePermissionRequest,
  isQuestionRequest as coreIsQuestionRequest,
  resolveEffectiveFileOperationPolicy,
  type PermissionHandlerAPI,
  type PermissionFileRequestData,
  type PermissionQuestionRequestData,
  type PermissionQuestionResponseData,
} from '@accomplish_ai/agent-core';
import { createHttpServer, type Route } from './http-server-factory.js';
import { RateLimiter } from './rate-limiter.js';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export class PermissionService {
  private permissionHandler: PermissionHandlerAPI;
  private permissionServer: http.Server | null = null;
  private questionServer: http.Server | null = null;
  private getActiveTaskId: (() => string | null) | null = null;
  private onPermissionRequest: ((request: unknown) => void) | null = null;
  private hasConnectedClients: (() => boolean) | null = null;
  private authToken: string;
  private permissionPort: number | null = null;
  private questionPort: number | null = null;
  private rateLimiter = new RateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS);

  constructor(authToken: string) {
    this.permissionHandler = createPermissionHandler();
    this.authToken = authToken;
  }

  init(
    taskIdGetter: () => string | null,
    permissionRequestHandler: (request: unknown) => void,
    connectedClientsChecker?: () => boolean,
  ): void {
    this.getActiveTaskId = taskIdGetter;
    this.onPermissionRequest = permissionRequestHandler;
    this.hasConnectedClients = connectedClientsChecker ?? null;
  }

  getPorts(): { permissionPort: number | null; questionPort: number | null } {
    return { permissionPort: this.permissionPort, questionPort: this.questionPort };
  }

  resolvePermission(requestId: string, allowed: boolean): boolean {
    return this.permissionHandler.resolvePermissionRequest(requestId, allowed);
  }

  resolveQuestion(requestId: string, response: PermissionQuestionResponseData): boolean {
    return this.permissionHandler.resolveQuestionRequest(requestId, response);
  }

  isFilePermissionRequest(requestId: string): boolean {
    return coreIsFilePermissionRequest(requestId);
  }

  isQuestionRequest(requestId: string): boolean {
    return coreIsQuestionRequest(requestId);
  }

  async startPermissionApiServer(fixedPort?: number): Promise<http.Server> {
    const routes: Route[] = [
      {
        method: 'POST',
        path: '/permission',
        handler: async (data, _req, res) => {
          const validation = this.permissionHandler.validateFilePermissionRequest(
            data as PermissionFileRequestData,
          );
          if (!validation.valid) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: validation.error }));
            return;
          }

          if (!this.getActiveTaskId) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Permission API not initialized' }));
            return;
          }

          const taskId = this.getActiveTaskId();
          if (!taskId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No active task' }));
            return;
          }

          // Auto-deny when no UI client is connected — no one can approve
          if (this.hasConnectedClients && !this.hasConnectedClients()) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ allowed: false }));
            return;
          }

          const requestData = data as PermissionFileRequestData;
          const operation = requestData.operation;

          if (resolveEffectiveFileOperationPolicy() === 'create_copy_only') {
            if (
              operation === 'delete' ||
              operation === 'move' ||
              operation === 'rename' ||
              operation === 'modify' ||
              operation === 'overwrite'
            ) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ allowed: false }));
              return;
            }

            if (operation === 'create') {
              const isCopyRequest = Boolean(requestData.targetPath);
              if (isCopyRequest && (!requestData.filePaths || requestData.filePaths.length === 0)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    error:
                      'Copy requests must include filePaths (sources) and targetPath (destination)',
                  }),
                );
                return;
              }

              const destinations: string[] = [];
              if (requestData.targetPath) {
                destinations.push(requestData.targetPath);
              } else if (requestData.filePath) {
                destinations.push(requestData.filePath);
              } else if (requestData.filePaths && requestData.filePaths.length > 0) {
                // Batch create: treat filePaths as destination paths.
                destinations.push(...requestData.filePaths);
              }

              if (destinations.length === 0) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({ error: 'Create requests must include a destination path' }),
                );
                return;
              }

              const destinationExists = await Promise.all(destinations.map((p) => pathExists(p)));
              if (destinationExists.some(Boolean)) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ allowed: false }));
                return;
              }
            }
          }

          const { requestId, promise } = this.permissionHandler.createPermissionRequest();
          const permissionRequest = this.permissionHandler.buildFilePermissionRequest(
            requestId,
            taskId,
            requestData,
          );

          this.onPermissionRequest?.(permissionRequest);

          try {
            const allowed = await promise;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ allowed }));
          } catch {
            res.writeHead(408, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Request timed out', allowed: false }));
          }
        },
      },
    ];

    const { server, port } = await createHttpServer({
      authToken: this.authToken,
      rateLimiter: this.rateLimiter,
      routes,
      serviceName: 'PermissionService:Permission',
      port: fixedPort,
    });

    this.permissionServer = server;
    this.permissionPort = port;
    return server;
  }

  async startQuestionApiServer(fixedPort?: number): Promise<http.Server> {
    const routes: Route[] = [
      {
        method: 'POST',
        path: '/question',
        handler: async (data, _req, res) => {
          const validation = this.permissionHandler.validateQuestionRequest(
            data as PermissionQuestionRequestData,
          );
          if (!validation.valid) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: validation.error }));
            return;
          }

          if (!this.getActiveTaskId) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Question API not initialized' }));
            return;
          }

          const taskId = this.getActiveTaskId();
          if (!taskId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No active task' }));
            return;
          }

          // Auto-deny when no UI client is connected — no one can answer
          if (this.hasConnectedClients && !this.hasConnectedClients()) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ denied: true }));
            return;
          }

          const { requestId, promise } = this.permissionHandler.createQuestionRequest();
          const questionRequest = this.permissionHandler.buildQuestionRequest(
            requestId,
            taskId,
            data as PermissionQuestionRequestData,
          );

          this.onPermissionRequest?.(questionRequest);

          try {
            const response = await promise;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          } catch {
            res.writeHead(408, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Request timed out', denied: true }));
          }
        },
      },
    ];

    const { server, port } = await createHttpServer({
      authToken: this.authToken,
      rateLimiter: this.rateLimiter,
      routes,
      serviceName: 'PermissionService:Question',
      port: fixedPort,
    });

    this.questionServer = server;
    this.questionPort = port;
    return server;
  }

  close(): void {
    this.rateLimiter.dispose();
    if (this.permissionServer) {
      this.permissionServer.close();
      this.permissionServer = null;
    }
    if (this.questionServer) {
      this.questionServer.close();
      this.questionServer = null;
    }
  }
}
