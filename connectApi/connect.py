import boto3
import os
import asyncio

class ConnectService:
    def __init__(self):
        self._connectClient = boto3.client('connect', region_name=os.environ['REGION'])

    def listPrompts(self):
        prompts = self._connectClient.list_prompts(
            InstanceId=os.environ['CONNECT_INSTANCE_ID']
        )
        return prompts

    def getFlowArns(self, nextToken=None):
        
        response = self._connectClient.list_contact_flows(
            InstanceId=os.environ['CONNECT_INSTANCE_ID']
        )
        return response


def handler(event=None, context=None):
    connectService = ConnectService()
    return getContactFlowDetails(connectService)

async def getContactFlowDetails(connectService: ConnectService):
    summaryList = []
    details = await connectService.getFlowArns()
    for summary in details:
      summaryList.append(summary)

    details['NextToken'] = 'asdf'
    if hasattr(details, 'NextToken'):
      print('foo')
    else:
      print('no')


    print(details)

asyncio.run(handler())