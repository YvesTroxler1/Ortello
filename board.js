const dimension = 8;

const empty = 0;
const one = 1;
const two = 2;

const initRowColPlayer = [
    [3, 3, two],
    [3, 4, one],
    [4, 4, two],
    [4, 3, one],
];

const shifts = [
    [-1, +0], // north
    [-1, +1], // north east
    [+0, +1], // east
    [+1, +1], // south east
    [+1, +0], // south
    [+1, -1], // south west
    [+0, -1], // west
    [-1, -1], // north west
];

export class Board {
    constructor() {
        let fields = [];
        for (let r = 0; r < dimension; r++) {
            let row = [];
            for (let c = 0; c < dimension; c++) {
                row.push(empty);
            }
            fields.push(row);
        }
        initRowColPlayer.forEach(([row, col, val]) => {
            fields[row][col] = val;
        });
        this.fields = fields;
    }

    static of(fields) {
        let board = new Board();
        if (fields.length != dimension) {
            throw new RangeError(`fields requires ${dimension} rows`);
        }
        for (let r = 0; r < dimension; r++) {
            let row = fields[r];
            if (row.length != dimension) {
                throw new RangeError(`row requires ${dimension} cols`);
            }
            for (let c = 0; c < dimension; c++) {
                if (row[c] !== empty && row[c] !== one && row[c] !== two) {
                    throw new RangeError(`illegal value ${row[c]} ([${r}/${c}])`);
                }
            }
        }
        board.fields = fields;
        return board;
    }

    validMoves(player) {
        if (player !== one && player !== two) {
            throw new RangeError(`illegal player ${player}`);
        }
        const validMoves = [];
        const emptyFields = this.fieldsWithState(empty);
        const otherPlayer = this.opponent(player);
        const emptyFieldsNextToOpponent = this.adjacentOf(emptyFields, otherPlayer);
        emptyFieldsNextToOpponent.forEach((candidate) => {
            const shift = candidate.shift;
            for (
                let field = candidate.adjacent;
                field[0] >= 0 &&
                field[0] < dimension &&
                field[1] >= 0 &&
                field[1] < dimension;
                field[0] += shift[0], field[1] += shift[1]
            ) {
                const fieldValue = this.fields[field[0]][field[1]];
                if (fieldValue == empty) {
                    break;
                }
                if (fieldValue == player) {
                    validMoves.push(candidate.original);
                    break;
                }
            }
        });
        // NOTE: Sets are unique by reference, not by value; de-duplicate using a Map.
        const dedup = (moves) => {
            const identify = (move) => `${move[0]}:${move[1]}`;
            const unique = new Map();
            moves.forEach((move) => unique.set(identify(move), move));
            return new Set(unique.values());
        };
        return dedup(validMoves);
    }

    play(row, col, player) {
        if (player !== one && player !== two) {
            throw new RangeError(`illegal player ${player}`);
        }
        if (typeof row != "number" || typeof col != "number") {
            throw new TypeError("row and col must be numbers");
        }
        if (row < 0 || row >= dimension || col < 0 || col >= dimension) {
            throw new RangeError(`move [${row}/${col}] is out of bounds`);
        }
        const validMoves = this.validMoves(player);
        const match = [...validMoves].filter(
            (move) => move[0] == row && move[1] == col,
        );
        if (match.length < 1) {
            throw new RangeError(
                `move [${row}/${col}] is not valid for player ${player}`,
            );
        }
        const otherPlayer = this.opponent(player);
        const newBoard = this.copy();
        newBoard.fields[row][col] = player;
        shifts.forEach((shift) => {
            const chain = [];
            for (
                let field = [row + shift[0], col + shift[1]];
                field[0] >= 0 &&
                field[0] < dimension &&
                field[1] >= 0 &&
                field[1] < dimension;
                field[0] += shift[0], field[1] += shift[1]
            ) {
                const fieldValue = newBoard.fields[field[0]][field[1]];
                if (fieldValue == otherPlayer) {
                    // opponent's field: mark for takeover
                    chain.push([field[0], field[1]]);
                } else if (fieldValue == player) {
                    // own field at the end of the chain: take over fields
                    for (const [r, c] of chain) {
                        newBoard.fields[r][c] = player;
                    }
                    break;
                } else {
                    // empty field: nothing to capture in this direction
                    break;
                }
            }
        });
        return newBoard;
    }

    result() {
        const emptyFields = this.fieldsWithState(empty);
        const playerOneFields = this.fieldsWithState(one);
        const playerTwoFields = this.fieldsWithState(two);
        const finished = emptyFields.length == 0;
        let tied = false;
        let winner = 0;
        if (finished) {
            if (playerOneFields.length > playerTwoFields.length) {
                winner = one;
            } else if (playerOneFields.length < playerTwoFields.length) {
                winner = two;
            } else {
                tied = true;
            }
        }
        return {
            playerOne: playerOneFields.length,
            playerTwo: playerTwoFields.length,
            finished: finished,
            tied: tied,
            winner: winner,
        };
    }

    copy() {
        let rows = [];
        for (let row = 0; row < dimension; row++) {
            let cols = [];
            for (let col = 0; col < dimension; col++) {
                cols.push(this.fields[row][col]);
            }
            rows.push(cols);
        }
        return Board.of(rows);
    }

    adjacentOf(fields, state) {
        const adjacents = [];
        fields.forEach((field) => {
            const [r, c] = field;
            for (const shift of shifts) {
                const [newRow, newCol] = [r + shift[0], c + shift[1]];
                if (
                    newRow < 0 ||
                    newRow >= dimension ||
                    newCol < 0 ||
                    newCol >= dimension
                ) {
                    continue;
                }
                if (this.fields[newRow][newCol] == state) {
                    adjacents.push({
                        original: [r, c],
                        shift: shift,
                        adjacent: [newRow, newCol],
                    });
                }
            }
        });
        return adjacents;
    }

    fieldsWithState(state) {
        const fields = [];
        for (const row in this.fields) {
            for (const col in this.fields[row]) {
                if (this.fields[row][col] == state) {
                    fields.push([Number(row), Number(col)]);
                }
            }
        }
        return fields;
    }

    opponent(player) {
        if (player == one) {
            return two;
        } else if (player == two) {
            return one;
        }
        throw RangeError(`illegal player ${player}`);
    }

    isValidMove(player, row, col) {
        if (player !== one && player !== two) {
            throw new RangeError(`illegal player ${player}`);
        }
        if (typeof row !== "number" || typeof col !== "number") {
            throw new TypeError("row and col must be numbers");
        }
        if (row < 0 || row >= dimension || col < 0 || col >= dimension) {
            throw new RangeError(`move [${row}/${col}] is out of bounds`);
        }
        if (this.fields[row][col] !== empty) {
            return false; // belegt
        }

        const other = this.opponent(player);

        for (const [dr, dc] of shifts) {
            let r = row + dr, c = col + dc;

            if (r < 0 || r >= dimension || c < 0 || c >= dimension) continue;
            if (this.fields[r][c] !== other) continue;

            r += dr; c += dc;
            while (r >= 0 && r < dimension && c >= 0 && c < dimension) {
                const v = this.fields[r][c];
                if (v === empty) break;
                if (v === player) return true;
                r += dr; c += dc;
            }
        }
        return false;
    }
}
