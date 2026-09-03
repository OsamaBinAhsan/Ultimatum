const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '118.179.41.2,1433';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ---------------------------------------------------------------------------
// Room State & Data Structures
// ---------------------------------------------------------------------------
const RECIPES = [
  { name: 'Classic Burger', ingredients: ['bun', 'cooked_patty', 'lettuce'], points: 200, tips: 60, time: 45 },
  { name: 'Cheeseburger Deluxe', ingredients: ['bun', 'cooked_patty', 'cheese', 'tomato'], points: 280, tips: 85, time: 50 },
  { name: 'Vegan Salad Bowl', ingredients: ['chopped_lettuce', 'chopped_tomato', 'cheese'], points: 190, tips: 50, time: 40 },
  { name: 'Mega Bacon Stack', ingredients: ['bun', 'cooked_patty', 'cheese', 'chopped_tomato', 'lettuce'], points: 350, tips: 120, time: 55 },
];

class KitchenRoom {
  constructor(code, hostId, hostName) {
    this.code = code;
    this.hostId = hostId;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    this.shiftActive = false;
    this.shiftEnded = false;
    this.shiftTimer = 180; // 3-minute shifts (180s)
    this.orderCounter = 1;

    this.players = new Map();
    this.addPlayer(hostId, hostName || 'Head Chef', '#f43f5e');

    // Kitchen Stations
    this.stoves = [
      { id: 0, x: 220, y: 160, status: 'empty', timer: 0, maxTime: 8, item: null },
      { id: 1, x: 300, y: 160, status: 'empty', timer: 0, maxTime: 8, item: null },
      { id: 2, x: 380, y: 160, status: 'empty', timer: 0, maxTime: 8, item: null },
    ];

    this.cuttingBoards = [
      { id: 0, x: 500, y: 160, status: 'empty', progress: 0, maxProgress: 5, item: null },
      { id: 1, x: 580, y: 160, status: 'empty', progress: 0, maxProgress: 5, item: null },
    ];

    this.assemblyPlates = [
      { id: 0, x: 320, y: 440, items: [] },
      { id: 1, x: 420, y: 440, items: [] },
    ];

    this.activeOrders = [];
    this.stats = {
      ordersServed: 0,
      ordersBurned: 0,
      ordersFailed: 0,
      totalTips: 0,
    };

    this.spawnOrder();
    this.spawnOrder();
  }

  addPlayer(id, name, color) {
    const chefColors = ['#f43f5e', '#06b6d4', '#eab308', '#a855f7'];
    const assignedColor = color || chefColors[this.players.size % chefColors.length];
    const spawnPositions = [
      { x: 340, y: 300 },
      { x: 420, y: 300 },
      { x: 340, y: 360 },
      { x: 420, y: 360 },
    ];
    const spawn = spawnPositions[this.players.size % spawnPositions.length];

    this.players.set(id, {
      id,
      name: name || `Chef ${this.players.size + 1}`,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      color: assignedColor,
      holdingItem: null,
      score: 0,
      isHost: id === this.hostId,
    });
    this.lastActivity = Date.now();
  }

  removePlayer(id) {
    this.players.delete(id);
    if (id === this.hostId && this.players.size > 0) {
      const nextHost = this.players.keys().next().value;
      this.hostId = nextHost;
      const player = this.players.get(nextHost);
      if (player) player.isHost = true;
    }
    this.lastActivity = Date.now();
  }

  spawnOrder() {
    if (this.activeOrders.length >= 4) return;
    const recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    this.activeOrders.push({
      id: this.orderCounter++,
      recipeName: recipe.name,
      ingredients: [...recipe.ingredients],
      timeRemaining: recipe.time,
      maxTime: recipe.time,
      points: recipe.points,
      tips: recipe.tips,
    });
  }

  tick(dt) {
    this.lastActivity = Date.now();
    if (!this.shiftActive || this.shiftEnded) return;

    // 1. Shift Timer Countdown
    this.shiftTimer -= dt;
    if (this.shiftTimer <= 0) {
      this.shiftTimer = 0;
      this.shiftActive = false;
      this.shiftEnded = true;
      return;
    }

    // 2. Stove Cooking & Burning Simulation
    for (const stove of this.stoves) {
      if (stove.status === 'cooking') {
        stove.timer += dt;
        if (stove.timer >= stove.maxTime) {
          stove.status = 'ready';
          stove.item = 'cooked_patty';
        }
      } else if (stove.status === 'ready') {
        stove.timer += dt;
        // Burns after 6 seconds of sitting ready
        if (stove.timer >= stove.maxTime + 6) {
          stove.status = 'burnt';
          stove.item = 'burnt_patty';
          this.stats.ordersBurned += 1;
        }
      }
    }

    // 3. Active Orders Countdown
    for (let i = this.activeOrders.length - 1; i >= 0; i--) {
      const order = this.activeOrders[i];
      order.timeRemaining -= dt;
      if (order.timeRemaining <= 0) {
        this.stats.ordersFailed += 1;
        this.activeOrders.splice(i, 1);
      }
    }

    // 4. Order Spawner
    if (this.activeOrders.length < 3 && Math.random() < 0.05) {
      this.spawnOrder();
    }
  }

  // Highly compressed state payload to minimize network bandwidth
  getCompressedState() {
    const playersArr = [];
    for (const [_, p] of this.players) {
      playersArr.push({
        id: p.id,
        n: p.name,
        x: Math.round(p.x),
        y: Math.round(p.y),
        c: p.color,
        h: p.holdingItem,
        s: p.score,
        host: p.isHost,
      });
    }

    return {
      c: this.code,
      sa: this.shiftActive,
      se: this.shiftEnded,
      t: Math.ceil(this.shiftTimer),
      p: playersArr,
      st: this.stoves.map((s) => ({ id: s.id, st: s.status, tm: Math.round(s.timer), it: s.item })),
      cb: this.cuttingBoards.map((b) => ({ id: b.id, st: b.status, pr: b.progress, it: b.item })),
      ap: this.assemblyPlates.map((a) => ({ id: a.id, it: a.items })),
      o: this.activeOrders.map((o) => ({
        id: o.id,
        n: o.recipeName,
        ing: o.ingredients,
        tr: Math.ceil(o.timeRemaining),
        mt: o.maxTime,
        pts: o.points,
        tip: o.tips,
      })),
      stat: this.stats,
    };
  }
}

// ---------------------------------------------------------------------------
// Sabotage Circuit Room Manager (5-Player Deception Game)
// ---------------------------------------------------------------------------
class SabotageRoom {
  constructor(code, hostId, hostName) {
    this.code = code;
    this.hostId = hostId;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    this.status = 'LOBBY';
    this.players = new Map();
    this.addPlayer(hostId, hostName || 'CHIEF-ENG', true);
  }

  addPlayer(id, name, isHost = false) {
    this.players.set(id, {
      id,
      name: name || `OPERATOR-${this.players.size + 1}`,
      isHost,
      role: 'ENGINEER',
      splitPart: null,
    });
    this.lastActivity = Date.now();
  }

  removePlayer(id) {
    this.players.delete(id);
    if (id === this.hostId && this.players.size > 0) {
      const nextHost = this.players.keys().next().value;
      this.hostId = nextHost;
      const player = this.players.get(nextHost);
      if (player) player.isHost = true;
    }
    this.lastActivity = Date.now();
  }

  getRoster() {
    return Array.from(this.players.values());
  }
}

// ---------------------------------------------------------------------------
// The Architect & The Rats Room Manager (1v4 Asymmetrical Maze Arena)
// ---------------------------------------------------------------------------
class ArchiratRoom {
  constructor(code, hostId, hostName) {
    this.code = code;
    this.hostId = hostId;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    this.phase = 'LOBBY';
    this.players = new Map();
    this.grid = null;
    this.trueExit = { x: 18, y: 18 };
    this.startTile = { x: 1, y: 1 };
    this.addPlayer(hostId, hostName || 'Architect (Host)', 'Architect', true);
  }

  addPlayer(id, name, role = 'Rat', isHost = false) {
    const RAT_COLORS = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6'];
    const assignedColor = role === 'Architect' ? '#e94560' : RAT_COLORS[(this.players.size - 1) % RAT_COLORS.length] || '#fbbf24';
    this.players.set(id, {
      id,
      name: name || (role === 'Architect' ? 'Architect' : `Rat ${this.players.size}`),
      role,
      color: assignedColor,
      wins: 0,
      isHost,
    });
    this.lastActivity = Date.now();
  }

  removePlayer(id) {
    this.players.delete(id);
    if (id === this.hostId && this.players.size > 0) {
      const nextHost = this.players.keys().next().value;
      this.hostId = nextHost;
      const player = this.players.get(nextHost);
      if (player) {
        player.isHost = true;
        player.role = 'Architect';
        player.color = '#e94560';
      }
    }
    this.lastActivity = Date.now();
  }

  getRoster() {
    return Array.from(this.players.values());
  }
}

// ---------------------------------------------------------------------------
// Server Authority & Room Managers
// ---------------------------------------------------------------------------
const rooms = new Map(); // RoomCode -> KitchenRoom
const sabotageRooms = new Map(); // RoomCode -> SabotageRoom
const archiratRooms = new Map(); // RoomCode -> ArchiratRoom
const playerRoomMap = new Map(); // SocketID -> { code, gameType: 'kitchen' | 'sabotage' | 'archirat' }

function generateRoomCode(targetMap = rooms) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return targetMap.has(code) ? generateRoomCode(targetMap) : code;
}

// ---------------------------------------------------------------------------
// Server Initialization & 20 Ticks/Sec Engine Loop
// ---------------------------------------------------------------------------
app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('Error handling request:', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // 20 Ticks / Second (50ms Interval) Engine Loop
  const TICK_RATE = 20;
  const DT = 1 / TICK_RATE;

  setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      // Memory cleanup: Purge empty rooms or rooms inactive for > 15 minutes
      if (room.players.size === 0 || now - room.lastActivity > 15 * 60 * 1000) {
        rooms.delete(code);
        continue;
      }

      room.tick(DT);
      io.to(code).emit('game_tick', room.getCompressedState());
    }
  }, 1000 / TICK_RATE);

  // -------------------------------------------------------------------------
  // WebSocket Events
  // -------------------------------------------------------------------------
  io.on('connection', (socket) => {
    // 1. Host Game (Create Room)
    socket.on('create_room', ({ playerName }) => {
      const roomCode = generateRoomCode();
      const room = new KitchenRoom(roomCode, socket.id, playerName);
      rooms.set(roomCode, room);
      playerRoomMap.set(socket.id, roomCode);

      socket.join(roomCode);
      socket.emit('room_created', {
        roomCode,
        playerId: socket.id,
        state: room.getCompressedState(),
      });
    });

    // 2. Join Game
    socket.on('join_room', ({ roomCode, playerName }) => {
      const upperCode = (roomCode || '').toUpperCase().trim();
      const room = rooms.get(upperCode);

      if (!room) {
        socket.emit('join_error', { message: `Room '${upperCode}' not found.` });
        return;
      }

      if (room.players.size >= 4) {
        socket.emit('join_error', { message: `Room '${upperCode}' is full (Max 4 Chefs).` });
        return;
      }

      room.addPlayer(socket.id, playerName);
      playerRoomMap.set(socket.id, upperCode);

      socket.join(upperCode);
      socket.emit('room_joined', {
        roomCode: upperCode,
        playerId: socket.id,
        state: room.getCompressedState(),
      });

      io.to(upperCode).emit('player_joined', {
        playerId: socket.id,
        playerName,
        state: room.getCompressedState(),
      });
    });

    // 3. Start Shift
    socket.on('start_shift', () => {
      const roomCode = playerRoomMap.get(socket.id);
      const room = rooms.get(roomCode);
      if (!room || room.hostId !== socket.id) return;

      room.shiftActive = true;
      room.shiftEnded = false;
      room.shiftTimer = 180;
      io.to(roomCode).emit('shift_started', room.getCompressedState());
    });

    // 4. Restart Shift
    socket.on('restart_shift', () => {
      const roomCode = playerRoomMap.get(socket.id);
      const room = rooms.get(roomCode);
      if (!room) return;

      room.shiftActive = true;
      room.shiftEnded = false;
      room.shiftTimer = 180;
      room.stats = { ordersServed: 0, ordersBurned: 0, ordersFailed: 0, totalTips: 0 };
      room.stoves.forEach((s) => {
        s.status = 'empty';
        s.timer = 0;
        s.item = null;
      });
      room.cuttingBoards.forEach((b) => {
        b.status = 'empty';
        b.progress = 0;
        b.item = null;
      });
      room.assemblyPlates.forEach((a) => {
        a.items = [];
      });
      room.activeOrders = [];
      room.spawnOrder();
      room.spawnOrder();

      io.to(roomCode).emit('shift_restarted', room.getCompressedState());
    });

    // 5. Player Movement & Input (Client Prediction & Server Reconciliation)
    socket.on('player_move', ({ x, y, vx, vy }) => {
      const roomCode = playerRoomMap.get(socket.id);
      const room = rooms.get(roomCode);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      // Server bounds check: Kitchen area 800x600, inner boundaries
      player.x = Math.max(80, Math.min(720, x));
      player.y = Math.max(140, Math.min(520, y));
      player.vx = vx || 0;
      player.vy = vy || 0;
    });

    // 6. Kitchen Actions (Pick Ingredient, Cook, Chop, Plate, Serve, Toss)
    socket.on('kitchen_action', ({ action, payload }) => {
      const roomCode = playerRoomMap.get(socket.id);
      const room = rooms.get(roomCode);
      if (!room || !room.shiftActive || room.shiftEnded) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      // Pick Raw Ingredient (bun, raw_patty, raw_lettuce, raw_tomato, cheese)
      if (action === 'pick_ingredient') {
        if (!player.holdingItem) {
          player.holdingItem = payload.ingredient;
        }
      }

      // Interact with Stove (Place patty or Pick cooked patty)
      if (action === 'interact_stove') {
        const stove = room.stoves.find((s) => s.id === payload.stoveId);
        if (stove) {
          if (stove.status === 'empty' && player.holdingItem === 'raw_patty') {
            stove.status = 'cooking';
            stove.timer = 0;
            stove.item = 'cooking_patty';
            player.holdingItem = null;
          } else if ((stove.status === 'ready' || stove.status === 'burnt') && !player.holdingItem) {
            player.holdingItem = stove.item;
            stove.status = 'empty';
            stove.timer = 0;
            stove.item = null;
          }
        }
      }

      // Interact with Cutting Board
      if (action === 'interact_chopping') {
        const board = room.cuttingBoards.find((b) => b.id === payload.boardId);
        if (board) {
          if (board.status === 'empty' && (player.holdingItem === 'raw_lettuce' || player.holdingItem === 'raw_tomato')) {
            board.item = player.holdingItem;
            board.status = 'chopping';
            board.progress = 0;
            player.holdingItem = null;
          } else if (board.status === 'chopping') {
            board.progress += 1;
            if (board.progress >= board.maxProgress) {
              board.status = 'chopped';
              board.item = board.item === 'raw_lettuce' ? 'chopped_lettuce' : 'chopped_tomato';
            }
          } else if (board.status === 'chopped' && !player.holdingItem) {
            player.holdingItem = board.item;
            board.status = 'empty';
            board.progress = 0;
            board.item = null;
          }
        }
      }

      // Add Item to Assembly Plate
      if (action === 'interact_plate') {
        const plate = room.assemblyPlates.find((p) => p.id === payload.plateId);
        if (plate) {
          if (player.holdingItem && player.holdingItem !== 'burnt_patty' && !player.holdingItem.startsWith('raw_')) {
            plate.items.push(player.holdingItem);
            player.holdingItem = null;
          } else if (!player.holdingItem && plate.items.length > 0) {
            // Pick up finished assembled plate
            player.holdingItem = `plated:${plate.items.join('+')}`;
            plate.items = [];
          }
        }
      }

      // Serve Order to Service Window
      if (action === 'serve_order') {
        if (player.holdingItem && player.holdingItem.startsWith('plated:')) {
          const platedIngredients = player.holdingItem.replace('plated:', '').split('+');

          // Check against active orders
          let matchedOrderIdx = -1;
          for (let i = 0; i < room.activeOrders.length; i++) {
            const order = room.activeOrders[i];
            const hasAll = order.ingredients.every((ing) => platedIngredients.includes(ing));
            const sameCount = order.ingredients.length === platedIngredients.length;
            if (hasAll && sameCount) {
              matchedOrderIdx = i;
              break;
            }
          }

          if (matchedOrderIdx !== -1) {
            const order = room.activeOrders[matchedOrderIdx];
            player.score += order.points + order.tips;
            room.stats.ordersServed += 1;
            room.stats.totalTips += order.tips;
            room.activeOrders.splice(matchedOrderIdx, 1);
            player.holdingItem = null;
            room.spawnOrder();

            io.to(roomCode).emit('order_served_success', {
              recipeName: order.recipeName,
              points: order.points,
              tips: order.tips,
              servedBy: player.name,
            });
          }
        }
      }

      // Toss Item in Trash
      if (action === 'toss_trash') {
        if (player.holdingItem) {
          player.holdingItem = null;
        }
      }
    });

    // -------------------------------------------------------------------------
    // SABOTAGE CIRCUIT MULTIPLAYER EVENTS
    // -------------------------------------------------------------------------

    // 1. Host Sabotage Room
    socket.on('sabotage_create_room', ({ playerName }) => {
      const roomCode = generateRoomCode(sabotageRooms);
      const room = new SabotageRoom(roomCode, socket.id, playerName);
      sabotageRooms.set(roomCode, room);
      playerRoomMap.set(socket.id, { code: roomCode, gameType: 'sabotage' });

      socket.join(roomCode);
      socket.emit('sabotage_room_created', {
        roomCode,
        playerId: socket.id,
        players: room.getRoster(),
      });
    });

    // 2. Join Sabotage Room
    socket.on('sabotage_join_room', ({ roomCode, playerName }) => {
      const upperCode = (roomCode || '').toUpperCase().trim();
      const room = sabotageRooms.get(upperCode);

      if (!room) {
        socket.emit('sabotage_join_error', { message: `Room '${upperCode}' not found.` });
        return;
      }

      if (room.players.size >= 5) {
        socket.emit('sabotage_join_error', { message: `Room '${upperCode}' is full (Max 5 Operators).` });
        return;
      }

      room.addPlayer(socket.id, playerName);
      playerRoomMap.set(socket.id, { code: upperCode, gameType: 'sabotage' });

      socket.join(upperCode);
      socket.emit('sabotage_room_joined', {
        roomCode: upperCode,
        playerId: socket.id,
        players: room.getRoster(),
      });

      io.to(upperCode).emit('sabotage_roster', {
        players: room.getRoster(),
      });
    });

    // 3. Start Sabotage Game
    socket.on('sabotage_start_game', ({ roomCode, players, initState }) => {
      const upperCode = (roomCode || '').toUpperCase().trim();
      const room = sabotageRooms.get(upperCode);
      if (!room || room.hostId !== socket.id) return;

      room.status = 'PLAYING';
      io.to(upperCode).emit('sabotage_game_start', {
        players,
        initState,
      });
    });

    // 4. Sabotage Client Intent (from player to host)
    socket.on('sabotage_client_intent', ({ roomCode, intent }) => {
      const upperCode = (roomCode || '').toUpperCase().trim();
      const room = sabotageRooms.get(upperCode);
      if (!room) return;

      // Forward to room host
      io.to(room.hostId).emit('sabotage_host_process_intent', {
        senderId: socket.id,
        intent,
      });
    });

    // 5. Sabotage State Sync (from host to all room players)
    socket.on('sabotage_state_sync', ({ roomCode, state }) => {
      const upperCode = (roomCode || '').toUpperCase().trim();
      socket.to(upperCode).emit('sabotage_state_update', { state });
    });

    // 6. Sabotage Match Over
    socket.on('sabotage_match_over', ({ roomCode, payload }) => {
      const upperCode = (roomCode || '').toUpperCase().trim();
      const room = sabotageRooms.get(upperCode);
      if (room) room.status = 'GAMEOVER';
      io.to(upperCode).emit('sabotage_game_over', payload);
    });

    // -------------------------------------------------------------------------
    // THE ARCHITECT & THE RATS MULTIPLAYER EVENTS
    // -------------------------------------------------------------------------

    // 1. Host Maze Arena
    socket.on('archirat_create_room', ({ playerName }) => {
      const roomCode = generateRoomCode(archiratRooms);
      const room = new ArchiratRoom(roomCode, socket.id, playerName);
      archiratRooms.set(roomCode, room);
      playerRoomMap.set(socket.id, { code: roomCode, gameType: 'archirat' });

      socket.join(roomCode);
      socket.emit('archirat_room_created', {
        roomCode,
        playerId: socket.id,
        players: room.getRoster(),
      });
    });

    // 2. Join Maze Arena
    socket.on('archirat_join_room', ({ roomCode, playerName }) => {
      const upperCode = (roomCode || '').toUpperCase().trim();
      const room = archiratRooms.get(upperCode);

      if (!room) {
        socket.emit('archirat_join_error', { message: `Room '${upperCode}' not found.` });
        return;
      }

      if (room.players.size >= 5) {
        socket.emit('archirat_join_error', { message: `Room '${upperCode}' is full (Max 5 Players).` });
        return;
      }

      room.addPlayer(socket.id, playerName, 'Rat');
      playerRoomMap.set(socket.id, { code: upperCode, gameType: 'archirat' });

      socket.join(upperCode);
      socket.emit('archirat_room_joined', {
        roomCode: upperCode,
        playerId: socket.id,
        players: room.getRoster(),
      });

      io.to(upperCode).emit('archirat_roster', {
        players: room.getRoster(),
      });
    });

    // 3. Start Architect Phase
    socket.on('archirat_start_architect', ({ roomCode }) => {
      const upperCode = (roomCode || '').toUpperCase().trim();
      const room = archiratRooms.get(upperCode);
      if (!room || room.hostId !== socket.id) return;

      room.phase = 'ARCHITECT';
      io.to(upperCode).emit('archirat_phase_architect', {
        timer: 20,
        players: room.getRoster(),
      });
    });

    // 4. Architect Finished Maze -> Start Rat Phase
    socket.on('archirat_maze_ready', ({ roomCode, grid, trueExit, startTile }) => {
      const upperCode = (roomCode || '').toUpperCase().trim();
      const room = archiratRooms.get(upperCode);
      if (!room) return;

      room.phase = 'RAT';
      room.grid = grid;
      room.trueExit = trueExit;
      room.startTile = startTile;

      io.to(upperCode).emit('archirat_phase_rat', {
        grid,
        trueExit,
        startTile,
        matchTime: 45,
      });
    });

    // 5. Rat Movement Synchronization
    socket.on('archirat_rat_move', ({ roomCode, ratState }) => {
      const upperCode = (roomCode || '').toUpperCase().trim();
      socket.to(upperCode).emit('archirat_remote_rat_move', {
        ratState: { ...ratState, id: socket.id },
      });
    });

    // 6. Trap Detonations
    socket.on('archirat_trigger_trap', ({ roomCode, trapData }) => {
      const upperCode = (roomCode || '').toUpperCase().trim();
      io.to(upperCode).emit('archirat_trap_detonated', trapData);
    });

    // 7. Abilities (Lights Out, Sonar, Emotes)
    socket.on('archirat_ability', ({ roomCode, ability, payload }) => {
      const upperCode = (roomCode || '').toUpperCase().trim();
      io.to(upperCode).emit('archirat_ability_triggered', {
        senderId: socket.id,
        ability,
        payload,
      });
    });

    // 8. Round Over & Role Rotation
    socket.on('archirat_round_over', ({ roomCode, winnerRole, winnerName, nextArchitectId }) => {
      const upperCode = (roomCode || '').toUpperCase().trim();
      const room = archiratRooms.get(upperCode);
      if (room) {
        room.phase = 'ROUNDOVER';
        if (winnerRole === 'Rat' && nextArchitectId) {
          room.players.forEach((p) => {
            if (p.id === nextArchitectId) {
              p.role = 'Architect';
              p.color = '#e94560';
              p.isHost = true;
              room.hostId = nextArchitectId;
            } else {
              p.role = 'Rat';
              p.isHost = false;
            }
          });
        }
      }

      io.to(upperCode).emit('archirat_round_ended', {
        winnerRole,
        winnerName,
        players: room ? room.getRoster() : [],
      });
    });

    // -------------------------------------------------------------------------
    // Universal Disconnect Handler
    // -------------------------------------------------------------------------
    socket.on('disconnect', () => {
      const mapping = playerRoomMap.get(socket.id);
      if (mapping) {
        const { code, gameType } = typeof mapping === 'object' ? mapping : { code: mapping, gameType: 'kitchen' };

        if (gameType === 'kitchen') {
          const room = rooms.get(code);
          if (room) {
            room.removePlayer(socket.id);
            io.to(code).emit('player_left', {
              playerId: socket.id,
              state: room.getCompressedState(),
            });
          }
        } else if (gameType === 'sabotage') {
          const room = sabotageRooms.get(code);
          if (room) {
            room.removePlayer(socket.id);
            io.to(code).emit('sabotage_roster', {
              players: room.getRoster(),
            });
          }
        } else if (gameType === 'archirat') {
          const room = archiratRooms.get(code);
          if (room) {
            room.removePlayer(socket.id);
            io.to(code).emit('archirat_player_left', {
              playerId: socket.id,
              players: room.getRoster(),
            });
          }
        }

        playerRoomMap.delete(socket.id);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Post Scheduler: Auto-publishes due scheduled posts every 1 minute
  // -----------------------------------------------------------------------
  const SCHEDULER_INTERVAL_MS = 60 * 1000;
  const SCHEDULER_SECRET = process.env.SCHEDULER_SECRET || '';
  setTimeout(() => {
    const runScheduler = async () => {
      try {
        const res = await fetch(`http://${hostname}:${port}/api/scheduler/publish`, {
          method: 'POST',
          headers: { 'x-scheduler-secret': SCHEDULER_SECRET },
        });
        const data = await res.json();
        if (data.total > 0) {
          console.log(`[Scheduler] Auto-published ${data.total} item(s):`, data.published);
        }
      } catch (e) {
        // Silently skip if server not fully ready yet
      }
    };
    runScheduler();
    setInterval(runScheduler, SCHEDULER_INTERVAL_MS);
  }, 5000);

  server.listen(port, () => {
    console.log(`> Pixel Kitchen Rush server live on http://${hostname}:${port}`);
  });
});
