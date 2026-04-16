try {
  require('better-sqlite3');
  console.log('electron better-sqlite3 ok');
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
