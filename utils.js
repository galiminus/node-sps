exports.buildConnectionId = (serverId, entityId) => {
  return (
   `${serverId.split('-')[0]}:${entityId}`
  );
}
