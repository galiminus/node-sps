# Node SPS

Node SPS is an naive implementation of a Spatial Publish-Subscribe server. Most of its logic is based on Postgis geometries and PostgreSQL LISTEN/NOTIFY. It is naive because so far I have really no clue about how this will scale, but I thought it was fun to build something simple like that on top of it.

Spatial Publish-Subscribe is just like your usual Pub/Sub mechanism, so Node SPS has queues, messages and listeners, but publication and subscription can be limited to 3D polygon with arbitrary coordinates and shape and the message is only sent to a client when both the message geometry and the subscription geometry overlap.

On paper, it makes it easy to do things like limiting events to a particular room in a 3D world, or to only get events in your current line of sight.

## Usage

Node SPS ships with a simple CLI API, more will be added later:


Create a server, which a just a container for subscriptions:
```
node index.js servers:create
{"status"=>"ok", "result"=>{"id"=>"894a15f6-48d1-49fb-94ea-ab27e4ff3f3f"}}
```


Create a first entity, entities are like users and this command will output the entity ID and a connection token.
```
node index.js entities:create
{"status"=>"ok", "result"=>{"id"=>"292795ed-f009-4ea9-ba50-4a15231c47e6", "token"=>"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjI5Mjc5NWVkLWYwMDktNGVhOS1iYTUwLTRhMTUyMzFjNDdlNiIsImlhdCI6MTU3NzYyOTQyMH0.CrFrA0W_uovpdWIDIOMjWX8bpAJM6YE4Msn4g0mwIvs"}}

```

Create another entity and makes it listen to events on a particular point
```
node index.js entities:create
{"status"=>"ok", "result"=>{"id"=>"8dc7c87d-260d-47c8-b53c-92c86914e290", "token"=>"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhkYzdjODdkLTI2MGQtNDdjOC1iNTNjLTkyYzg2OTE0ZTI5MCIsImlhdCI6MTU3NzYyOTQyMH0.5LBB-VtnpkV5kEc9IEqsLlL4XbXjnJuVHFqgw1Lp_mA"}}

node index.js subscriptions:create 894a15f6-48d1-49fb-94ea-ab27e4ff3f3f 8dc7c87d-260d-47c8-b53c-92c86914e290 'test:test' 'POINT(0 0 0)'
{"status"=>"ok", "result"=>{"id"=>"f618532a-37b0-46f8-87b1-c162bdf702dc"}}

node index.js actions:listen 894a15f6-48d1-49fb-94ea-ab27e4ff3f3f 8dc7c87d-260d-47c8-b53c-92c86914e290
```

Push an action on the same point with the first entity
```
node index.js actions:create 292795ed-f009-4ea9-ba50-4a15231c47e6 'test:test' 'NEW_ACTION' '{"a":"b"}' 'POINT(0 0 0)'
{"status"=>"ok"}
```

The action is received by the second entity.
```
{"id"=>"076031d6-2a1f-4bef-a971-a91be34581bc", "entity_id"=>"292795ed-f009-4ea9-ba50-4a15231c47e6", "type"=>"NEW_ACTION", "payload"=>{"a"=>"b"}}
```

Clean things up.
```
node index.js servers:destroy 894a15f6-48d1-49fb-94ea-ab27e4ff3f3f
{"status"=>"ok"}

node index.js entities:destroy 292795ed-f009-4ea9-ba50-4a15231c47e6
{"status"=>"ok"}

node index.js entities:destroy 8dc7c87d-260d-47c8-b53c-92c86914e290
{"status"=>"ok"}
```