# hasGateAccess accepts an optional gateId parameter

The bot currently controls a single gate. We expect users will need per-gate access in the near future. Rather than introduce a breaking interface change then, `hasGateAccess(userId, gateId?)` accepts a `gateId` parameter now, defaulting to `config.GATE_DEVICE_ID`.

The `gateId` argument is currently unused in the implementation — all authorized users have access to all gates. When per-gate permissions are added, the DB check will use it.
