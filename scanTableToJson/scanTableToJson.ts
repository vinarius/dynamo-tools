console.log('Scan to Json initiated...');

import { DynamoDB } from 'aws-sdk';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { resolve } from 'path';

const unsetEnvVars: string[] = [];
if (process.env['AWS_PROFILE'] === undefined) unsetEnvVars.push('AWS_PROFILE');
if (process.env['SOURCE_ENV'] === undefined) unsetEnvVars.push('SOURCE_ENV');
if (process.env['SOURCE_TABLE_NAME'] === undefined) unsetEnvVars.push('SOURCE_TABLE_NAME');
if (process.env['DESTINATION_TABLE_NAME'] === undefined) unsetEnvVars.push('DESTINATION_TABLE_NAME');
if (process.env['REGION'] === undefined) unsetEnvVars.push('REGION');
if (process.env['PROJECT'] === undefined) unsetEnvVars.push('PROJECT');

if (unsetEnvVars.length > 0) {
  console.error(`Please set the following environment variables and run the script again:\n${unsetEnvVars.join(' ')}`);
  process.exit(1);
}

(async () => {
  try {
    const sourceEnv: string = process.env['SOURCE_ENV'] ?? '';
    const sourceTableName: string = process.env['SOURCE_TABLE_NAME'] ?? '';
    const destinationTableName: string = process.env['DESTINATION_TABLE_NAME'] ?? '';
    const region: string = process.env['REGION'] ?? '';
    const project: string = process.env['PROJECT'] ?? '';

    const ddb: DynamoDB = new DynamoDB({
      region
    });

    const backupDirectory = resolve(__dirname, 'backups');
    const dataDirectory = resolve(backupDirectory, project, sourceEnv);

    // 1 - Get data from source
    let nextToken = undefined;
    let scanData: DynamoDB.ItemList = [];
    do {
      const scanOutput: DynamoDB.ScanOutput = await ddb.scan({
        TableName: sourceTableName,
        ...(nextToken && {ExclusiveStartKey: nextToken})
      }).promise();
      nextToken = scanOutput.LastEvaluatedKey;
      scanData = [
        ...scanData,
        ...scanOutput.Items as DynamoDB.ItemList
      ]
    } while(nextToken);

    // 2 - Normalize data and output to .json to how aws.dynamodb.batch-write-item expects input
    let fileCounter: number = 1;
    const jsonConstructorObject: DynamoDB.BatchWriteItemRequestMap = {};
    jsonConstructorObject[destinationTableName] = [];

    let projectDataDirectoryMade = false;
    for (let i: number = 0; i < scanData.length; i++) {
      const data: DynamoDB.AttributeMap = scanData[i];
      const putRequest: DynamoDB.WriteRequest = {
        'PutRequest': {
          'Item': data
        }
      };

      if (jsonConstructorObject[destinationTableName].length === 25) {
        if (existsSync(dataDirectory) && !projectDataDirectoryMade) {
          rmSync(dataDirectory, {
            recursive: true,
            force: true
          });
          mkdirSync(dataDirectory, { recursive: true });
          projectDataDirectoryMade = true;
        }

        if (!existsSync(dataDirectory) && !projectDataDirectoryMade) {
          mkdirSync(dataDirectory, { recursive: true });
          projectDataDirectoryMade = true;
        }

        writeFileSync(`${dataDirectory}/${fileCounter}.json`, JSON.stringify(jsonConstructorObject));
        fileCounter++;
        jsonConstructorObject[destinationTableName] = [];
      }

      jsonConstructorObject[destinationTableName].push(putRequest);
    }

    if (jsonConstructorObject[destinationTableName].length > 0) {
      if (existsSync(dataDirectory) && !projectDataDirectoryMade) {
        rmSync(dataDirectory, {
          force: true,
          recursive: true
        });
        mkdirSync(dataDirectory, { recursive: true });
        projectDataDirectoryMade = true;
      }

      if (!existsSync(dataDirectory) && !projectDataDirectoryMade) {
        mkdirSync(dataDirectory, { recursive: true });
        projectDataDirectoryMade = true;
      }

      writeFileSync(`${dataDirectory}/${fileCounter}.json`, JSON.stringify(jsonConstructorObject));
    }

    console.log('Scan to Json complete');
  } catch (error) {
    throw new Error(error);
  }
})();