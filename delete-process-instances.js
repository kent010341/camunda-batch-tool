const { HttpClient, HttpHeaders } = require('@ngify/http');
const { GET_PROCESS_INSTANCE_URL, DELETE_PROCESS_INSTANCE_URL, 
  INCLUDED_CONDITION, EXCLUDED_CONDITION } = require('./settings');
const { map, mergeMap, tap } = require('rxjs/operators');
const { of, forkJoin } = require('rxjs');

const http = new HttpClient();

// Header
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json; charset=utf-8' })
};

function getIds(condition) {
  return http.post(GET_PROCESS_INSTANCE_URL, condition, httpOptions).pipe(
    map(resp => resp.json().map(instance => instance.id))
  );
}

function getIncludedProcessIds() {
  return getIds(INCLUDED_CONDITION);
}

function getExcludedProcessIdsDict() {
  if (!EXCLUDED_CONDITION) {
    return of({});
  } else {
    return getIds(EXCLUDED_CONDITION).pipe(
      map(ids => {
        const idsDict = {};
        ids.forEach(id => {
          idsDict[id] = true;
        });
        return idsDict;
      })
    );
  }
}

function deleteProcessInstance(id) {
  const url = DELETE_PROCESS_INSTANCE_URL + id;
  return http.delete(url, httpOptions).pipe(
    tap({
      next: () => console.log(`Successfully delete process instance ID '${id}'`),
      error: err => console.log(`Failed to delete process instance ID '${id}! msg: ${err.response.data}'`)
    })
  );
}

function main() {
  const includedIds$ = getIncludedProcessIds();
  const excludedIds$ = getExcludedProcessIdsDict();

  forkJoin([includedIds$, excludedIds$]).pipe(
    mergeMap(([includedIds, excludedIdsDict]) => {
      const deleteObs$ = includedIds
        .filter(id => excludedIdsDict[id] == null)
        .map(id => deleteProcessInstance(id));

      return forkJoin(deleteObs$);
    }),
  ).subscribe(([id, exid]) => console.log(id, exid));
}

main();
