// server/gameLogic.js
const SUITS = ['♠', '♣', '♥', '♦'];
const RANKS = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = { '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

const TURN_MS = 30000; // 30 секунд на ход

const createDeck = () => {
  let id = 0;
  const deck = SUITS.flatMap(suit => RANKS.map(rank => ({ suit, rank, id: id++ })));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const canBeat = (attackCard, defenseCard, trumpSuit) => {
  if (attackCard.suit === defenseCard.suit) {
    return RANK_VALUES[defenseCard.rank] > RANK_VALUES[attackCard.rank];
  }
  return defenseCard.suit === trumpSuit && attackCard.suit !== trumpSuit;
};

const createInitialGameState = (players, mode) => {
  const deck = createDeck();
  const trumpCard = deck[deck.length - 1];

  players.forEach(player => {
    player.hand = deck.splice(0, 6);
  });

  let attackerIndex = 0;
  let lowestTrumpRankValue = Infinity;

  players.forEach((player, index) => {
    const playerTrumps = player.hand.filter(c => c.suit === trumpCard.suit);
    if (playerTrumps.length > 0) {
      const minRankInHand = Math.min(...playerTrumps.map(c => RANK_VALUES[c.rank]));
      if (minRankInHand < lowestTrumpRankValue) {
        lowestTrumpRankValue = minRankInHand;
        attackerIndex = index;
      }
    }
  });

  if (lowestTrumpRankValue === Infinity) {
    attackerIndex = Math.floor(Math.random() * players.length);
  }

  const defenderIndex = (attackerIndex + 1) % players.length;

  return {
    deck, trumpCard, table: [], discardPile: [],
    attackerIndex, defenderIndex, mode,
    // ⬇️ фиксируем лимит подкидываний на СТАРТЕ взятки
    trickLimit: Math.min(6, players[defenderIndex].hand.length),
    message: `Игра началась! Атакует ${players[attackerIndex].username}`,
    turnFinishedBy: [],
    turnEndsAt: Date.now() + TURN_MS,
    isResolvingRound: false,
  };
};

const endRound = (room) => {
  const state = room.gameState;
  const players = room.players;
  if (!state || state.isResolvingRound) return;
  state.isResolvingRound = true;

  const defender = players[state.defenderIndex];
  const defenderTookCards = state.table.some(p => !p.defense);

  if (defenderTookCards) {
    state.table.forEach(pair => {
      defender.hand.push(pair.attack);
      if (pair.defense) defender.hand.push(pair.defense);
    });
  } else {
    state.discardPile.push(...state.table.flatMap(p => [p.attack, p.defense].filter(Boolean)));
  }
  state.table = [];
  state.turnFinishedBy = [];

  // добор до 6
  players.forEach((p) => {
    const cardsNeeded = 6 - p.hand.length;
    if (cardsNeeded > 0) {
      p.hand.push(...state.deck.splice(0, cardsNeeded));
    }
  });

  // хард-окончание при пустой колоде
  if (state.deck.length === 0) {
    const playersWithCards = players.filter(p => p.hand.length > 0);
    if (playersWithCards.length <= 1) {
      room.status = 'finished';
      state.loser = playersWithCards[0] || null;
      state.message = `Игра окончена! ${state.loser ? `Проигравший: ${state.loser.username}` : 'Ничья!'}`;
      state.isResolvingRound = false;
      return;
    }
  }

  if (defenderTookCards) {
    state.attackerIndex = (state.defenderIndex + 1) % players.length;
  } else {
    state.attackerIndex = state.defenderIndex;
  }
  state.defenderIndex = (state.attackerIndex + 1) % players.length;

  // ⬇️ новый фиксированный лимит на СЛЕДУЮЩУЮ взятку
  try {
    const defNext = players[state.defenderIndex];
    state.trickLimit = Math.min(6, (defNext?.hand?.length || 0));
  } catch {
    state.trickLimit = 6;
  }

  // ещё одна проверка на окончание после смены ролей
  if (Array.isArray(state.deck) && state.deck.length === 0) {
    const withCards = players.filter(p => Array.isArray(p.hand) && p.hand.length > 0);
    if (withCards.length <= 1) {
      state.loser = withCards[0] || null; // null => ничья
      room.status = 'finished';
      state.isResolvingRound = false;
      return;
    }
  }

  state.message = `Атакует ${players[state.attackerIndex].username}`;
  state.turnEndsAt = Date.now() + TURN_MS;
  state.isResolvingRound = false;
};

const handleTimeout = (room) => {
  const state = room.gameState;
  if (!state || state.isResolvingRound) return;

  const undefendedExists = state.table.some(p => !p.defense);
  if (undefendedExists) {
    const defender = room.players[state.defenderIndex];
    state.message = `${defender.username} не успел(а) отбиться и забирает карты.`;
    endRound(room);
  } else {
    // всё отбито — авто «Бито»
    state.message = `Раунд завершен. Бито!`;
    endRound(room);
  }
};

const getBotMove = (bot, state, players) => {
  const botIndex = players.findIndex(p => p.socketId === bot.socketId);
  const isAttacker = state.attackerIndex === botIndex;
  const isDefender = state.defenderIndex === botIndex;
  const canThrowIn = !isDefender && state.table.length > 0;

  if (isDefender) {
    const undefendedCardPair = state.table.find(p => !p.defense);
    if (!undefendedCardPair) return { action: 'pass' };

    // В переводном режиме бот попробует перевести, если возможно
    if (state.mode === 'Переводной' && state.table.length === 1) {
      const transferCard = bot.hand.find(c => c.rank === undefendedCardPair.attack.rank);
      if (transferCard) {
        const nextDefIndex = (state.defenderIndex + 1) % players.length;
        const nextDefender = players[nextDefIndex];
        if (nextDefender && (nextDefender.hand.length >= state.table.length + 1)) {
          return { action: 'transfer', card: transferCard };
        }
      }
    }

    const possibleCards = bot.hand.filter(c => canBeat(undefendedCardPair.attack, c, state.trumpCard.suit));
    if (possibleCards.length > 0) {
      const bestCard = possibleCards.sort((a, b) => RANK_VALUES[a.rank] - RANK_VALUES[b.rank])[0];
      return { action: 'defend', card: bestCard };
    } else {
      return { action: 'take' };
    }
  }

  if (isAttacker || canThrowIn) {
    const tableRanks = state.table.flatMap(p => [p.attack.rank, p.defense?.rank].filter(Boolean));
    let possibleCards;
    if (state.table.length === 0) {
      possibleCards = bot.hand.filter(c => c.suit !== state.trumpCard.suit);
      if (possibleCards.length === 0) possibleCards = bot.hand;
    } else {
      possibleCards = bot.hand.filter(c => tableRanks.includes(c.rank));
    }

    if (possibleCards.length > 0) {
      const bestCard = possibleCards.sort((a, b) => RANK_VALUES[a.rank] - RANK_VALUES[b.rank])[0];
      return { action: 'attack', card: bestCard };
    } else {
      return { action: 'pass' };
    }
  }
  return null;
};

const handlePlayerAction = (room, playerSocketId, action, card) => {
  const state = room.gameState;
  const players = room.players;
  const playerIndex = players.findIndex(p => p.socketId === playerSocketId);
  if (playerIndex === -1 || !state) return;
  const player = players[playerIndex];

  const isPrimaryAttacker = state.attackerIndex === playerIndex;
  const isDefender = state.defenderIndex === playerIndex;
  const canThrowIn = !isDefender && state.table.length > 0;

  if (state.isResolvingRound && (action === 'take' || action === 'pass')) return;

  switch (action) {
    case 'attack': {
      // ⬇️ фиксируем лимит на ВЕСЬ текущий раунд
      const defender = players[state.defenderIndex];
      const defendHand = Array.isArray(defender?.hand) ? defender.hand.length : 0;

      if (state.table.length === 0 || typeof state.trickLimit !== 'number') {
        state.trickLimit = Math.min(6, defendHand);
      }
      const maxAllowed = state.trickLimit;

      if (Array.isArray(state.table) && state.table.length >= maxAllowed) {
        state.message = `Нельзя подкидывать больше ${maxAllowed} карт`;
        // Если все уже отбиты — ускорим "Бито" через 3.5с
        try {
          const allDefended = state.table.every(p => p.defense);
          if (allDefended) {
            const soon = Date.now() + 3500;
            if (!state.turnEndsAt || state.turnEndsAt > soon) {
              state.turnEndsAt = soon;
            }
          }
        } catch {}
        return;
      }

      if ((!isPrimaryAttacker && !canThrowIn) || !player.hand.some(c => c.id === card?.id)) return;

      const tableRanks = state.table.flatMap(p => [p.attack.rank, p.defense?.rank].filter(Boolean));
      if (state.table.length > 0 && !tableRanks.includes(card.rank)) {
        state.message = "Нельзя подкинуть эту карту!";
        return;
      }

      player.hand = player.hand.filter(c => c.id !== card.id);
      state.table.push({ attack: card, defense: null });
      state.message = `${player.username} ходит ${card.rank}${card.suit}`;
      state.turnFinishedBy = [];
      state.turnEndsAt = Date.now() + TURN_MS;
      break;
    }

    case 'defend': {
      if (!isDefender || !player.hand.some(c => c.id === card?.id)) return;
      const undefendedCardPair = state.table.find(p => !p.defense);
      if (undefendedCardPair && canBeat(undefendedCardPair.attack, card, state.trumpCard.suit)) {
        player.hand = player.hand.filter(c => c.id !== card.id);
        undefendedCardPair.defense = card;
        state.message = `${player.username} отбивается ${card.rank}${card.suit}`;
        state.turnEndsAt = Date.now() + TURN_MS;
      } else {
        state.message = "Этой картой нельзя побить!";
      }
      break;
    }

    case 'transfer': {
      if (state.mode !== 'Переводной') return;
      if (!isDefender || !player.hand.some(c => c.id === card?.id)) return;
      // Перевод возможен только на первую карту и при отсутствии защиты
      const undefendedCardPair = state.table.find(p => !p.defense);
      if (!undefendedCardPair || state.table.length !== 1) {
        state.message = 'Перевод возможен только на первой карте.';
        return;
      }
      if (undefendedCardPair.attack.rank !== card.rank) {
        state.message = 'Переводить можно картой той же ранга.';
        return;
      }
      const nextDefIndex = (state.defenderIndex + 1) % players.length;
      const nextDefender = players[nextDefIndex];
      const maxAllowed = Math.min(6, nextDefender.hand.length);
      if (state.table.length + 1 > maxAllowed) {
        state.message = 'У следующего игрока недостаточно карт для перевода.';
        return;
      }
      player.hand = player.hand.filter(c => c.id !== card.id);
      state.table.push({ attack: card, defense: null });
      state.attackerIndex = state.defenderIndex;
      state.defenderIndex = nextDefIndex;
      state.trickLimit = maxAllowed;
      state.message = `${player.username} переводит ${card.rank}${card.suit}`;
      state.turnFinishedBy = [];
      state.turnEndsAt = Date.now() + TURN_MS;
      break;
    }

    case 'pass': {
      if (!isPrimaryAttacker && !canThrowIn) return;
      if (state.table.length === 0 || !state.table.every(p => p.defense)) {
        state.message = "Не все карты отбиты!";
        return;
      }
      state.message = "Раунд завершен. Бито!";
      endRound(room);
      break;
    }

    case 'take': {
      if (!isDefender || state.table.length === 0) return;
      state.message = `${player.username} забирает карты.`;
      endRound(room);
      break;
    }

    case 'surrender': {
      state.message = `${player.username} сдался.`;
      state.loser = player;
      room.status = 'finished';
      break;
    }
  }
};

// Экспорт
module.exports = { createInitialGameState, handlePlayerAction, getBotMove, handleTimeout };
