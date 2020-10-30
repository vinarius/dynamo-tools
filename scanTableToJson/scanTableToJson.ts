import { DynamoDB } from 'aws-sdk';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

(async () => {
    try {
        const unsetEnvVars = [];
        if(process.env['CLIENT'] === undefined) unsetEnvVars.push('CLIENT');
        if(process.env['PROJECT'] === undefined) unsetEnvVars.push('PROJECT');
        if(process.env['APPLICATION'] === undefined) unsetEnvVars.push('APPLICATION');
        if(process.env['ENVIRONMENT'] === undefined) unsetEnvVars.push('ENVIRONMENT');
        if(process.env['SOURCE_TABLE_NAME'] === undefined) unsetEnvVars.push('SOURCE_TABLE_NAME');
        if(process.env['REGION'] === undefined) unsetEnvVars.push('REGION');

        if(unsetEnvVars.length > 0) {
            console.error(`Please set the following environment variables and run the script again:\n${unsetEnvVars}`);
            process.exit(1);
        }

        const client: string = process.env['CLIENT'] ?? '';
        const project: string = process.env['PROJECT'] ?? '';
        const application: string = process.env['APPLICATION'] ?? '';
        const environment: string = process.env['ENVIRONMENT'] ?? '';
        const sourceTableName: string = process.env['SOURCE_TABLE_NAME'] ?? '';
        const region: string = process.env['REGION'] ?? '';

        const ddb: DynamoDB = new DynamoDB({
            region
        });

        const directoryName: string = `${application}-data`.toLowerCase();

        // 1 - Get data from source
        const scanData: DynamoDB.ScanOutput = await ddb.scan({
            TableName: sourceTableName
        }).promise();

        // 2 - Normalize data and output to .json to how aws.dynamodb.batch-write-item expects input
        let fileCounter: number = 1;
        const jsonConstructorObject: DynamoDB.BatchWriteItemRequestMap = {};
        jsonConstructorObject['data'] = [];

        for (let i:number = 0; i < scanData.Items.length; i++) {
            const data: DynamoDB.AttributeMap = scanData.Items[i];
            const putRequest: DynamoDB.WriteRequest = {
                'PutRequest': {
                    'Item': data
                }
            };

            if(jsonConstructorObject['data'].length === 25) {
                if(!existsSync(directoryName)) mkdirSync(directoryName);
                writeFileSync(`${directoryName}/${client}-${project}-${application}-dynamo-${fileCounter}.json`, JSON.stringify(jsonConstructorObject));
                fileCounter++;
                jsonConstructorObject['data'] = [];
            }
            
            jsonConstructorObject['data'].push(putRequest);
        }

        if(jsonConstructorObject['data'].length > 0) {
            if(!existsSync(directoryName)) mkdirSync(directoryName);
            writeFileSync(`${directoryName}/${client}-${project}-${environment}-dynamo-${fileCounter}.json`, JSON.stringify(jsonConstructorObject));
        }

        console.log('Write complete');
    } catch (error) {
        console.error(error);
    }
})();