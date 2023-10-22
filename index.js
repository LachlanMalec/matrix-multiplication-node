const { Worker, isMainThread, parentPort } = require('worker_threads');

function runWorker(workerData) {
  return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, { workerData });
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
          if (code !== 0) reject(new Error(`worker stopped with exit code ${code}`));
      });
  });
}

if (!isMainThread) {
  const { matrixA, matrixB, startRow, endRow } = require('worker_threads').workerData;
  const resultMatrix = multiplyMatrices(matrixA, matrixB, startRow, endRow);
  parentPort.postMessage(resultMatrix);
}

function multiplyMatrices(matrixA, matrixB, startRow, endRow) {
  const resultMatrix = [];
  for (let i = startRow; i < endRow; i++) {
      resultMatrix[i] = [];
      for (let j = 0; j < matrixB[0].length; j++) {
          resultMatrix[i][j] = 0;
          for (let k = 0; k < matrixA[0].length; k++) {
              resultMatrix[i][j] += matrixA[i][k] * matrixB[k][j];
          }
      }
  }
  return resultMatrix;
}

async function multiThreadedMatrixMultiplication(matrixA, matrixB, numWorkers) {
  const numRows = matrixA.length;
  const rowsPerWorker = Math.ceil(numRows / numWorkers);
  const promises = [];
  
  for (let i = 0; i < numWorkers; i++) {
      const startRow = i * rowsPerWorker;
      const endRow = Math.min(startRow + rowsPerWorker, numRows);
      promises.push(runWorker({ matrixA, matrixB, startRow, endRow }));
  }
  
  const resultMatrixChunks = await Promise.all(promises);
  const resultMatrix = [];
  for (const chunk of resultMatrixChunks) {
      resultMatrix.push(...chunk);
  }
  
  return resultMatrix;
}

const seed = 69;

function generateRandomMatrix(numRows, numColumns) {
  const matrix = [];
  for (let i = 0; i < numRows; i++) {
      matrix[i] = [];
      for (let j = 0; j < numColumns; j++) {
          matrix[i][j] = Math.floor(Math.random() * seed);
      }
  }
  return matrix;
}

const matrixA = generateRandomMatrix(1000, 1000);
const matrixB = generateRandomMatrix(1000, 1000);

let main = async () => {
  let timer = Date.now();

  await multiThreadedMatrixMultiplication(matrixA, matrixB, 4)
    .then(resultMatrix => console.log(resultMatrix))
    .catch(error => console.error(error));

  console.log(`Time taken: ${Date.now() - timer}ms`);

  process.exit(0);
}

main();
