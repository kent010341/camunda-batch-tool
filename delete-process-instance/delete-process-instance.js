const http = require('http');
const fs = require('fs');

// Load config
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// URIs
const HEALTH_CHECK_URI = `${config.baseUri}/engine`;
const GET_PROCESS_INSTANCE_URI = `${config.baseUri}/history/process-instance`;
const DELETE_PROCESS_INSTANCE_URI = `${config.baseUri}/process-instance`;

// Utility to perform HTTP requests
function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (res.statusCode != 204) {
            resolve(JSON.parse(data));
          }
        } else {
          reject(`HTTP Error: ${res.statusCode} - ${data}`);
        }
      });
    });

    req.on('error', (e) => {
      reject(e.message);
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

// Health check
async function healthCheck() {
  try {
    await httpRequest({ method: 'GET', host: config.host, port: config.port, path: HEALTH_CHECK_URI });
    console.log('Camunda service is healthy and reachable.');
  } catch (e) {
    console.error(`Camunda service (${CAMUNDA_URL}) is unavailable or unreachable!`);
  }
}

// Get IDs based on condition
async function getIds(condition) {
  try {
    const options = {
      method: 'POST',
      host: config.host,
      port: config.port,
      path: GET_PROCESS_INSTANCE_URI,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const body = JSON.stringify(condition);
    const instances = await httpRequest(options, body);
    return instances.map(instance => instance.id);
  } catch (e) {
    console.error(e);
    return [];
  }
}

// Delete process instance by ID
async function deleteProcessInstance(id) {
  try {
    await httpRequest({
      method: 'DELETE',
      host: config.host,
      port: config.port,
      path: `${DELETE_PROCESS_INSTANCE_URI}/${id}`
    });
    console.log(`Successfully deleted process instance ID '${id}'`);
  } catch (e) {
    console.error(`Failed to delete process instance ID '${id}': ${e}`);
  }
}

// Main logic
async function main() {
  await healthCheck();
  const includedIds = await getIds(config.includedCondition);

  let excludedIdsDict = {};
  if (Object.keys(config.excludedCondition).length !== 0) {
    const excludedIds = await getIds(config.excludedCondition);
    excludedIdsDict = excludedIds.reduce((acc, curr) => ({ ...acc, [curr]: true }), {});
  }

  console.log(`Found ${includedIds.length} processes, and will exclude ${Object.keys(excludedIdsDict).length} processes.`);

  for (const id of includedIds) {
    if (!excludedIdsDict[id]) {
      await deleteProcessInstance(id);
    }
  }
}

main();
