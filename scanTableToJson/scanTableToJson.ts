import { DynamoDB } from 'aws-sdk';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';

(async () => {
    try {
        const unsetEnvVars = [];
        if(process.env['ENVIRONMENT'] === undefined) unsetEnvVars.push('ENVIRONMENT');
        if(process.env['SOURCE_TABLE_NAME'] === undefined) unsetEnvVars.push('SOURCE_TABLE_NAME');
        if(process.env['DESTINATION_TABLE_NAME'] === undefined) unsetEnvVars.push('DESTINATION_TABLE_NAME');
        if(process.env['REGION'] === undefined) unsetEnvVars.push('REGION');

        if(unsetEnvVars.length > 0) {
            console.error(`Please set the following environment variables and run the script again:\n${unsetEnvVars}`);
            process.exit(1);
        }

        const environment: string = process.env['ENVIRONMENT'] ?? '';
        const sourceTableName: string = process.env['SOURCE_TABLE_NAME'] ?? '';
        const destinationTableName: string = process.env['DESTINATION_TABLE_NAME'] ?? '';
        const region: string = process.env['REGION'] ?? '';

        const ddb: DynamoDB = new DynamoDB({
            region
        });

        const directoryName: string = `data`;

        // 1 - Get data from source
        const scanData: DynamoDB.ScanOutput = await ddb.scan({
            TableName: sourceTableName
        }).promise();

        // 2 - Normalize data and output to .json to how aws.dynamodb.batch-write-item expects input
        let fileCounter: number = 1;
        const jsonConstructorObject: DynamoDB.BatchWriteItemRequestMap = {};
        jsonConstructorObject[destinationTableName] = [];

        for (let i:number = 0; i < scanData.Items.length; i++) {
            const data: DynamoDB.AttributeMap = scanData.Items[i];
            const putRequest: DynamoDB.WriteRequest = {
                'PutRequest': {
                    'Item': data
                }
            };

            if(jsonConstructorObject[destinationTableName].length === 25) {
                if(existsSync(directoryName)) rmSync(directoryName, {
                    force: true,
                    recursive: true
                });
                mkdirSync(directoryName);
                writeFileSync(`${directoryName}/${environment}-${fileCounter}.json`, JSON.stringify(jsonConstructorObject));
                fileCounter++;
                jsonConstructorObject[destinationTableName] = [];
            }
            
            jsonConstructorObject[destinationTableName].push(putRequest);
        }

        if(jsonConstructorObject[destinationTableName].length > 0) {
            if(existsSync(directoryName)) rmSync(directoryName, {
                force: true,
                recursive: true
            });
            mkdirSync(directoryName);
            writeFileSync(`${directoryName}/${environment}-${fileCounter}.json`, JSON.stringify(jsonConstructorObject));
        }

        console.log('Write complete');
    } catch (error) {
        console.error(error);
    }
})();