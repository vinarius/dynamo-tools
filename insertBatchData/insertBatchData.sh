AWS_PROFILE=$1 \
SOURCE_ENV=$2 \
DESTINATION_TABLE_NAME=$3 \
DESTINATION_REGION=$4 \
PROJECT=$5 \
ts-node insertBatchData/insertBatchData.ts