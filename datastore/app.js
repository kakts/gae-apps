'use strict';

const express = require('express');
const crypto = require('crypto');

const app = express();

app.enable('trust proxy');

const DataStore = require('@google-cloud/datastore');


const options = {
  // projectId: 'genial-shore-207314'
}
const datastore = DataStore(options);

function insertVisit(visit) {
  return datastore.save({
    key: datastore.key('visit'),
    data: visit
  });
}

function getVisits() {
  const query = datastore.createQuery('visit')
    .order('timestamp', {descending: true})
    .limit(10);

  return datastore.runQuery(query)
    .then((results) => {
      const entities = results[0];
      return entities.map((entity) => `Time: ${entity.timestamp}, AddrHash: ${entity.userIp}`);
    });
}

app.get('/', (req, res, next) => {
  const visit = {
    timestamp: new Date(),
    userIp: crypto.createHash('sha256').update(req.ip).digest('hex').substr(0,7)
  };
  insertVisit(visit)
    .then(() => getVisits())
    .then((visits) => {
      res
        .status(200)
        .set('Content-Type', 'text/plain')
        .send(`Last 10 visits: \n${visits.join('\n')}`)
        .end();
    })
    .catch(next);
});

const PORT = process.env.PORT || 8080;
app.listen(process.env.PORT || 8080, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit');
})