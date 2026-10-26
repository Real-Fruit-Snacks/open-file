# Features

The complete reference of what Open File does, section by section. For how it is built, see
[ARCHITECTURE.md](ARCHITECTURE.md); for the content formats, [CONTENT_GUIDE.md](CONTENT_GUIDE.md).

## Learn

- **75 interactive lessons**, from "how the pieces move" to attacking the fianchetto, defending the
  Greek gift, bishop-and-pawn endings, the bishop-and-knight mate, queen against rook, rook and bishop
  against rook, Catalan/QGD and French plans, exchange sacrifices, calculation and "when there is
  nothing to do". Every position is legality-checked in CI, the lines quoted in the text are replayed
  (a "mate" must be mate), and every task and scripted reply is verified against Stockfish.
- **A coach talks you through every lesson.** Each step is a conversation beside the board: the coach
  sets up the position and asks a question; after your move it says what the move does and **why it
  works**, and what to take into your own games. The tempting mistakes have their own answers, with the
  opponent's punishing reply played on the board (and a red arrow) until you take the move back; any
  other move that drops a piece, allows a mate or stalemates is explained from the board itself.
  Combinations, mating nets and techniques are **lines** of two to four moves: the opponent replies,
  the coach comments, and you play on. **You set the pace**: after the coach explains a move, the
  reply and the next question wait for _Continue_ (or →), so nothing moves on while you read. The
  conversation stays on screen to read back; on phones the coach's latest words sit right under the
  board, with _Continue_ and _Take back_ beside them, and nothing scrolls the page out from under
  you. "Show answer" plays the move with the explanation.
- **Three courses** with unlockable units — a lesson opened from a course leads back to it and on to
  the next item — and a two-minute **placement quiz** that recommends a course (the one Home suggests
  until you start another) and seeds your starting puzzle rating.
- **Lesson recall** brings the moves you learned back a few days later, then further apart; once a
  lesson has scheduled positions it is one click from Learn and from the end of every lesson, and
  showing the answer counts as a miss.
- **Mark a lesson as done** without working through it — from its card on Learn, its row in a
  course, or its own page — when you know it already; it then counts as completed in courses, on
  Learn and for the next lesson, but not as training (no streak day, no recall). Marking it not done
  starts it again; both come with an Undo. Doing every step later completes it for real.
- **Find a lesson**: all the lessons are one list under a search (any words, in any order, accents
  and punctuation ignored), a level and _Hide finished_, all kept in the address so Back returns to
  them, with a count of the lessons shown.
- A **mating patterns** gallery: the nineteen named mates as minimal diagrams, each with a drill and
  the library's puzzles of that shape.

## Puzzles

- **48,000 tactics** from the Lichess puzzle database (CC0), sampled across eight rating bands from
  400 to 2600+ and served in chunks, each a sample of its whole band. A puzzle needs one chunk, not a
  band: the first chunk of every band is precached, so every mode works offline from the first visit,
  and a chunk that cannot be loaded is simply passed over; download every puzzle from Settings for
  the full set offline.
- **Rated mode** with a **Glicko-2** puzzle rating: a calibration run for new learners, an
  uncertainty figure, credit that depends on hints, speed and repeats, and a rough conversion to
  Lichess, chess.com and FIDE ratings.
- Daily puzzle (the day's first result stands), practice **by theme** or **by opening** (every
  puzzle knows the opening it came from; a repertoire trains all its openings), **Puzzle Rush**
  (three-minute and survival; the clock stops while a puzzle downloads), **Woodpecker sets** solved
  in spaced cycles and shared as links, hints, streaks and per-theme statistics. Only rated mode asks
  for a starting rating; the other modes are open at once. A promotion always asks for the piece, so
  underpromotions can be solved with auto-queen on.
- A puzzle's **themes stay hidden** while you solve it, since they say what to look for: _Show the
  themes_ brings them up, and they show by themselves once it is solved or missed. The theme and
  opening catalogues have a search (and a group for themes), kept in the address; a theme you have
  tried five times shows your accuracy on it, and _Work on this_ when that is below your average.
- **Blind puzzles**: the board stays on the starting position while the line is played out in
  notation only, so the whole combination has to be seen in the head. Two, three or four-plus moves
  deep, each length with its own level (it starts a few hundred points under the puzzle rating, rises
  40 with a clean solve and drops 60 with a miss). Moves go in by clicking their two squares on the
  unchanging board or by typing them; a move that is not legal in the current position is turned down
  without counting as a miss. A **peek** shows the current position, but a solve after one leaves the
  level where it was; at the end the board shows where the line ends, to compare with what you saw.
- **Due puzzles**: missed puzzles come back on a 1-3-7-14-30 day schedule (Woodpecker misses stay in
  their set); **bookmarks**; and **puzzles from your own games**: every reviewed blunder becomes a
  puzzle, and a different move the engine rates as good as the review's (within half a pawn) counts
  as a solve.

## Drills

- Coordinate trainer (click the square or type it), piece vision, "find every capture / check" and
  **guess the position** drills, with a **blindfold** mode.
- **What's the threat?**: the board shows the position with your opponent to move (as if you had
  passed); play the move they threaten — two tries, then it is shown — and then a move that meets it.
  The answer says what the threat does (mates, wins the queen, a piece…), lists the moves that hold,
  and for the 1,200 bundled positions what was played in the real game instead. A threat or defence
  the stored answer does not name is put to the engine, which accepts one that is as strong. Threats
  you missed in **your own games** join the drill after a review (on the analysis board or in My
  games) and come back every third position until you have named each twice in a row. Only your own
  moves count when the game says which side you played (games against the engine, or games under the
  name you import with); otherwise both sides' do, and the drill says which side missed it.
- An **endgame library of 41 drills**, every position engine-verified and played out against a
  full-strength engine, arranged as an **endgame ladder**: checkmates; pawn endings (key squares, the
  square of the pawn, outside and protected passers, triangulation, the breakthrough, Réti); rook
  endings (Lucena, Philidor, Vancura, cutting off the king, the short-side and back-rank defences,
  rook against a pawn, bishop or knight); queen endings and minor pieces. A drill opened without a
  `?pos=` starts from one of its positions at random. A promotion counts once the new piece is safe,
  and won material once it is kept (a trade or a piece taken straight back is not a win). The
  library is a compact index with a search and a group filter (kept in the address), and a drill
  sets out its task beside the board, so the position can be studied before _Start_.
- Eight **endgame studies** (Réti, Saavedra and the only-move endings) to solve move by move; every
  accepted move, and every refused alternative, is checked against the engine.

## Openings

- **Sixteen built-in repertoires** — Italian, Ruy Lopez, Vienna, London, King's Indian Attack,
  English, Queen's Gambit, Alapin, Caro-Kann, French, QGD, Scandinavian, Slav, Nimzo-Indian, King's
  Indian, Najdorf — trained move by move with spaced repetition (SM-2), every learner move
  engine-checked. A missed move comes back ten minutes later as a move to recall (not as a new move
  shown with an arrow), then at growing intervals. A move reached by another move order (a
  transposition) is learned once: recalling or missing it counts in both lines. A move's note stays
  up until the learner goes on (Continue, Enter or →), and a finished line waits for _Next line_.
- Import your own PGN repertoires, **edit them on the board** with notes, **add lines straight from
  the analysis board**, **share a repertoire as a link** (through the share sheet where the device
  has one), and **practise it against the engine**, which follows the book while the game stays in
  it. Deleting a line or forgetting a repertoire's progress asks first; a stored repertoire that can
  no longer be read offers to copy its text or delete it.
- An optional **opening explorer** (Lichess masters and community games) shows what is played in any
  position; the card carries its own switch and says plainly when you are offline. It needs a
  Lichess account connected in Settings: Lichess answers explorer lookups only for a signed-in
  account, so each lookup carries the account's sign-in, and without one the card says how to
  connect it.
- **Find the gaps in a repertoire.** _Find gaps_ on any repertoire's page, built-in or your own,
  opens a panel beside the board (under it on phones) that asks the explorer what is played in each
  position where your opponent is to move and the repertoire has a reply, up to move 8, 12 (the
  default), 16 or 20; a position reached by different move orders is asked about once, and a Black
  repertoire against one first move skips move 1 ("Only lines after 1. e4 are checked").
  - **A gap** is a reply played in at least 5% of the games in that position, and in at least 50
    games (10 among the masters), after which the repertoire has no move of yours. A transposition
    into a line you answer counts as answered; a line that just stops counts as a gap ("the line
    stops there"). _Lichess players_ is the default database, with a note on why (masters rarely play
    the replies club players meet); _Masters_ is a tap away.
  - **Each gap** shows its line, the reply and how often it comes ("Played in 30% of 1,000 games ·
    comes up in about 1 game in 3"), most often met first (each reply weighted by how often the moves
    before it are played, your own alternatives sharing equally), and the board shows the selected
    one with an arrow. Replies one of your other repertoires answers are listed apart, by name. Once
    every position is checked, a summary says how much of the play the repertoire answers ("An
    answer is ready in 92% of games up to move 12"), with how that is worked out; rare and unlisted
    replies count against it.
  - **Gently.** One position at a time, half a second apart, and never beside another explorer
    lookup. When Lichess asks for a pause it waits the time it names (a minute when it names none),
    with a countdown, and gives up after three pauses in a row. Progress shows as "12 of 40
    positions"; _Stop_ keeps what was found, and _Check the other 28 positions_ carries on. Answers
    are kept for the session, so a second look is instant. With the explorer switched off, the panel
    explains the lookups first (only the positions are sent, with the Lichess sign-in) and offers
    _Turn on the explorer and find gaps_.
  - **Add an answer** shows the position after the reply, with the explorer's most successful answer
    as a green arrow and a one-tap button ("Add 1... c5 2. Nf3"); the other answers played there
    are a tap each, or you play your own. The reply and the answer are saved, the gap leaves the
    list, and the toast offers _Edit the line_. A built-in repertoire offers to make an editable copy
    first ("Italian Game (my copy)", or the copy you already have), and the progress moves to the
    copy, so no move is due twice.

## Classic games

Guess-the-move for **46 famous games** — from Légal's mate, the Immortal Draw, the Opera Game, the
Immortal and the Evergreen through McDonnell–La Bourdonnais, Steinitz, Rubinstein, Capablanca,
Réti–Alekhine, Torre–Lasker, the Polish and Peruvian Immortals, Fischer, Tal, Petrosian, Karpov and
Kasparov to Deep Blue — with notes on every key moment, three points for the game move and two when
the engine rates yours as good. Find a game by title, player, event, year or story, and filter by
era, difficulty and what you have played; the search and filters are kept in the address.

## Play

- **A new game screen** in the page, not a dialog over it: the opponent as cards (Stockfish, the
  human-like opponent, two players at one device), the side and the game (standard or Chess960) as
  one-tap choices, then the level or rating, the clock, an opening to practise and the help while
  you play. On wide screens a preview of the board stands beside it, from the side you will play,
  with the clocks as they will start and a Chess960 game's start drawn already (another one is a tap
  away); on phones the form has the screen to itself and Start stays pinned above the bottom bar.
- **Stockfish 19** in the browser at **eight strength levels**, from a beatable "Newcomer" (about 400)
  to full strength (the ratings are a rough guide), with optional clocks from bullet to classical. A
  flag that falls when the other side could never checkmate is a draw, as in the rules.
- A **human-like opponent** at any rating from 600 to 2600, in steps of 100. Maia-3, a neural network
  trained on millions of online games, predicts how players of that rating move in the position, and
  the opponent plays a move drawn from the prediction (never one the model expects fewer than 2% of
  such players to choose). So it plays like a person of the rating — natural plans, misjudged positions, missed tactics
  — rather than a strong engine with random blunders added, and no two games go the same way. It
  takes a moment over a move, longer when the position is less clear to it and less when its clock
  runs low. It is a one-time download of about 25 MB (the model and the runtime that plays it), kept
  on the device for offline play and removable in Settings, and it runs in a worker on your device.
  Hints, the coach and the review still come from Stockfish, and the blunder check and opening
  practice work as they do against the engine. Its games are recorded by rating, and two wins or two losses in a row
  at one rating suggest a step of 100 up or down.
- Take-backs (until the game is over — a finished game is recorded once), hints and "show threat"
  (the arrow's move is also given in words), keyboard move entry that keeps its focus between moves,
  PGN export and a hand-off to analysis from your side of the board. "Play again" repeats the last
  settings; "New game" opens the new game screen, with the way back to the game on the board.
- A **coach mode** that pauses after a mistake, explains it in words, links the lesson and offers a
  take-back. The coach judges at full strength whatever level you play against, and never interrupts a
  move that ends the game.
- A **blunder check** (off by default, in the game setup and in Settings): before a move that lets
  the opponent mate at once, or loses two pawns' worth or more to a sequence of captures, is played,
  it asks _checks, captures, threats?_ — "Look again", "Show me" (the move and its punishment, drawn
  and named) or "Play it anyway". It says nothing when every move loses as much (a fork), works in
  timed games too (it answers in a few milliseconds, without the engine), and the game summary counts
  the moves it held back.
- An **engine ladder** with the next rung one click away; its height is remembered even when the old
  games have scrolled out of the history, and a slip (three losses at a rung) clears after one game at
  the rung below. Only ordinary engine games count: handicap, simul, drill and human-like games are
  recorded under their own mode.
- **Opening practice** against a repertoire (the hint shows the repertoire's move; a clock pauses while
  a deviation alert is up), **two players** at one device, **blindfold** play with a peek button (the
  pieces return when the game ends), and a start from **any position**: a FEN, a lesson diagram, a
  solved puzzle or a moment of a reviewed game. A position the engine cannot play (the side not to move
  in check, or a game already over) is refused with a message.
- **Chess960** (_Game_ in the setup, remembered for the next game): the pieces behind the pawns start
  in one of the 960 Chess960 arrangements, a new one each game (_Play again_ draws another), named
  on the page (_Chess960 · position 274_). Castle by moving the king onto its rook; king and rook
  end on the usual squares, wherever they started. The engine plays by the same rules at every
  level, and take-backs, hints, the threat arrow, clocks, blindfold and two players at one device
  work as in standard chess. Coach mode, the blunder check, opening practice and the human-like
  opponent are for standard chess: the setup turns them off and says so. The PGN carries
  `[Variant "Chess960"]`, `[SetUp "1"]` and the start position's FEN, and _Analyze game_ opens the
  game by its rules.

## Play online

_Play_ (`/play`) is one page for every game, with no account: _Play a person_ (a game of chess at a
tap, or _Invite a friend_), _Play the computer_ (a new game against the engine or the human-like
opponent, or _Pass and play_ at one device, at `/play/computer`), the open games, the
[games made for two](#games-for-two) and your name online. Old links still work: `/play?fen=…` (and
the other links into a game against the computer) go on to `/play/computer`, and `/play/online`,
the old waiting room, to Play.

- **Post a game** with a tap on a time control — 1+0, 2+1, 3+0, 3+2, 5+0, 5+3, 10+0, 10+5, 15+10,
  30+0 or 30+20, or a custom one (1 to 180 minutes, 0 to 180 seconds a move) — and a colour (random,
  white or black). If someone is already waiting for the same game, the two are paired at once.
  Otherwise it is listed for everyone on Play, with your name and, if you choose, your puzzle
  rating, and anyone can join it. A game for two is posted from its own tile, with its options.
- **Join** a game from the list: chess or a game for two, each with its icon and options. The list
  shows how many other players are on Play.
- **Invite a friend.** _Invite a friend_ sets up any of the games (chess or a game for two) for
  whoever has the link, and keeps it out of the list; so does _Only people with the link_ in a
  game's setup. _Share link_ opens the phone's share sheet or copies the link. Whoever opens it
  joins the game. The link keeps working if your connection drops and comes back. For chess and
  Chess960, the time controls include a _Correspondence_ group (see below).
- **Wait anywhere.** A posted game stays up while you use the rest of the app. A slim bar under the
  header shows the waiting time, with _Cancel_ and a way back to Play. When someone joins, a sound
  plays and the bar offers _Go to the board_ (or _Go to the duel_). On Play itself, the board opens
  at once. A game in progress elsewhere in the app gets a _Back to the board_ bar, even after the
  app has been closed or reloaded (the phone closing it in the background, say). Closing the app
  withdraws a post that is still waiting. After three minutes with nobody, Play suggests the
  human-like opponent meanwhile, and the post stays up.
- **Names, not accounts.** You play under a name the app makes up from two word lists, such as
  "Patient Bishop" (_New name_ picks another). Messages are a few set phrases (_Good luck_, _Well
  played_, _Good game_…), so nothing anyone types ever reaches anyone else.
- **The game.** The relay is the referee: it takes only legal moves and keeps both clocks, which
  start with Black's first move. Each side's first move must come within 45 seconds, or the game is
  aborted, and either side can abort before both have moved. Then you can resign, offer a draw (it
  stands until a move is made or it is declined) or ask to take back a move (never past the first
  moves). Mate, stalemate, a dead position, threefold repetition and the fifty-move rule end the
  game by themselves. A flag that falls when the other side could never mate is a draw. If your
  opponent's connection has been gone for 30 seconds, you can claim the win or a draw. Rematches
  swap the colours. Focus mode and the move sounds work as against the computer. If the connection
  drops, the board stays playable and catches up when it is back; a move made meanwhile is sent
  then.
- **No engine help.** The live board has no hints, evaluation or threats.
- **Premoves.** While your opponent thinks, make your next move: it waits on the board, marked, and
  is played the moment their move arrives, or dropped quietly when it is no longer legal. Clicking
  elsewhere, or Escape wherever the focus is, calls it off; a premoved promotion becomes a queen.
  With the keyboard, select and place the piece as for any move; screen readers hear "Premove g1
  to f3: played as soon as it is your move." and "Premove cancelled." Premoves work in every live
  game against a person, on the relay and on Lichess, but not in blindfold or correspondence games;
  _Settings → Play → Premoves in live games_ turns them off.
- **Watch a game.** While a game on the relay is on, _Copy watch link_ (the share sheet on a phone)
  gives a link, `/play/watch/<id>`, that anyone can open to follow the game as it happens: the
  board from White's side (_Flip_ turns it), both clocks, the moves, the offers and the result, and
  nothing to play. A blindfold game shows its pieces to the people watching; the players' phrases,
  and an army before both are in, stay private. Up to 20 can watch a game, and the players (and
  the watchers) see how many ("2 watching"). Opening a game's own link without a seat in it watches
  it too. Duels, and games on Lichess, are not watched.
- **Correspondence games**, by invitation: in _Invite a friend_, chess or Chess960 with a time
  control from the _Correspondence_ group, 1, 2, 3, 5, 7 or 14 days for every move, and a colour.
  _Create the link_ opens your board at once, with the link to send (_Copy the link_); whoever opens
  it sees _Join this game_, and the first to press it takes the other seat (once both seats are
  taken, the link only watches). Each side has its days for every move, and the board shows the days and hours the side
  to move has left instead of a ticking clock. A deadline that passes loses on time (a draw when the
  other side could never mate), or aborts the game before both sides have moved. There is no
  45-second first move and no claim against a player who is away: players come and go. Draws,
  takebacks and resignation work as in any game; premoves and focus mode are left out. An
  invitation nobody takes within a week expires.
  - **Your correspondence games** on Play lists them, your move first: the opponent, whose move it
    is and the time left ("Your move · 2 days 23 h left · 3 days a move"), or how a game ended. It
    is brought up to date from the games' rooms when Play opens and when the app starts, and a game
    stays listed for a week after it ends. When it is your move, the bar under the header says so
    ("Your move in 2 correspondence games."), with the way to the board or the list.
  - The relay keeps a correspondence game for a week after it ends, and a year at most; this
    device keeps its seat as long. With _Correspondence games_ on in Settings → App →
    [Notifications](#notifications), the relay tells you when it is your move, even with the app
    closed.
- **Afterwards**, the game is in My games (_played online_), from your side, ready for the engine
  review. A game on the relay played against the clock carries the clock after each move (`[%clk]`)
  and its `TimeControl`, so the review shows how the time was spent; a Chess960 game carries its
  tags. Aborted games and games of fewer than two moves are not kept.
  _Analyse together_ then opens a shared analysis board with the game's moves for both players
  (and anyone watching who presses it): see [Analyze](#analyze).
- **Also look on Lichess.** When a Lichess account is connected, a switch posts the same game on
  Lichess as well, rated or casual. Whoever accepts first plays you. The other post is withdrawn at
  once, and a game that slipped through on the other side in the same moment is aborted. Lichess
  takes only rapid and slower games from apps (the initial time plus 40 increments comes to eight
  minutes or more), so faster games wait in the app's own room only. Private games never go to
  Lichess.
  A Lichess game is played on the board here with Lichess's clocks: moves, resign, abort, draws,
  takebacks and claims, but no chat. It stays in your Lichess history, opens there from a link, and
  joins My games with its Lichess address. The account needs Lichess's permission to play. Sign-ins
  made before 0.26 lack it, and Play offers _Allow live games on Lichess_, which signs in again and
  comes back.

## Games for two

Five of the arcade's games, and Chess960, against a person online, each posted from its tile on
Play with the options the poster chooses (and its link to practise alone first):

- **Puzzle race** — the same puzzle on both boards at the same moment, near a puzzle rating the
  poster picks (600 to 2400; it starts at the one nearest your own). The first move is the
  opponent's, as in every puzzle; a wrong move is out of the round, and the first clean solve takes
  it. _Best of three_: the first to two rounds wins, over five puzzles at most (a round nobody solves
  scores nothing). _Best of three, 15-second window_: as best of three, but a clean solve within 15
  seconds of the first shares the round, half a point each. _Three-minute race_: both get the same
  run of puzzles, starting below the rating and getting harder, each at their own pace; the most
  solved in three minutes wins, fewer wrong answers breaks a tie, and three wrong answers end a
  player's race early. A round lasts 90 seconds at most, and when it ends, the solution plays out for
  whoever did not find it.
- **Arbiter duel** — the same stretch of a classic game replays on both boards, then a move that
  breaks the rules, as in the arcade (the same eighteen kinds, subtler round by round). The first to
  call it (the button, or Space) takes the round; a call on a legal move is out of it. First to three
  rounds, at a normal or a slow pace, faster each round. After each round the board shows the rule
  that was broken.
- **Who Stands Better? duel** — five quiet positions from the classic games, judged on the arcade's
  slider, 30 seconds each. A judgement is locked in for good, and the other player sees only that it
  is in; then the engine's verdict and both judgements show, scored as in the arcade (up to 100
  points; none for calling the wrong side better). The higher total wins.
- **Army Draft** — both players buy an army from the same budget (20, 30 or 39 points) within two
  minutes, each seeing only their own; an army is drafted for whoever has none when the time is up.
  The game then starts from the two armies — kings are free, and nobody castles — with a time control
  and colours as in any game.
- **Blindfold** — a real game with the pieces hidden for both, with a time control and colours as in
  any game: moves are typed (or played on the hidden board), the last move shows in words, and each
  player may peek three times, for two seconds. Each sees how many peeks the other has used. The
  pieces come back when the game ends.
- **Chess960** — chess from one of the 960 start positions, the same for both sides, with a time
  control and colours as in any game. The relay draws the position for each game and the board
  names it by its number ("Chess960 · position 192"); a rematch keeps it, with the colours swapped.
  Castle by moving the king onto its own rook. The relay referees by Chess960's rules, and offers,
  takebacks, claims, premoves, watching and the phrases work as in chess. It can be played by
  correspondence, by invitation. It waits on the app's own relay only, never on Lichess as well
  (the setup says so). Finished games are kept in My games with their Chess960
  tags, marked _Chess960_. Its _Practise alone_ link opens a Chess960 game against the computer.

The race, Arbiter and Who Stands Better? are **duels**, with no clock. The poster's device deals the
rounds; the relay checks them (only puzzle ids, positions and moves, so nothing either device sends
reaches the other as text) and sends the same to both. Each round starts on both boards at once,
after a three-second countdown, and times are measured on each device from the moment the round
appears there. The score stays in view (over the board on a phone); a round's result stays up for a
few seconds, with what each player did, and the rounds played are listed beside the board. Resign, rematch, the set
phrases and focus mode work as in a game of chess. A duel that has not started within a minute (the
rounds not dealt, a player not arrived) is called off, and one the host's device cannot prepare (the
puzzles out of reach offline, say) says why. Duels are not kept in My games; Army Draft and
blindfold games are, named for their game, an Army Draft game from its drafted start.

**Puzzle race rooms** take the race to up to eight. The race's setup has _Race against_: _One
opponent_ (posted as above) or _A room for up to eight_, with _Five rounds_ or a _Three-minute
race_ and the puzzle rating; _Make the room_ opens the room's page (`/play/race/<id>`) with its link
to send (_Copy link_, or _Share link_ with the share sheet on a phone). Quick search's _Race room_
leads to the same setup.

- **The room.** Whoever opens the link sees the room and the players in it and joins under their
  name (_Join the room_); a visitor may look on first. The players are listed with who is the host,
  who is you, and who is here or away. The host can change the options, and starts once at least
  two are in (_Start with 3 players_); the players there then race, on the same puzzles, dealt by
  the host's device and checked by the relay as for a duel. A full room gives the place of a
  player away for five minutes to whoever joins. A host away for 30 seconds hands the room to
  whoever has been there longest, and one who leaves hands it over at once. _Leave the room_ leaves
  it for good.
- **Five rounds.** Each puzzle comes up on every board at once, after a three-second countdown, and
  its round ends when every racer has answered, or after 90 seconds. Clean solves score by their
  order, fastest first: 5, 4, 3 and 2 points for the first four, 1 for any other. The most points
  after five puzzles wins.
- **Three-minute race.** As against one opponent: the same run of puzzles, each at your own pace;
  the most solved wins, then the fewer wrong answers, and three wrong answers end your race. It ends
  early once every racer is through.
- **Standings and places.** The board sits beside live standings (those watching see the standings
  alone). At the end come the places, a tie sharing one ("You came 2nd with 4 points."), and the
  host can _Race again_, with the same options or others; the next race avoids the last one's
  puzzles. Whoever arrives during a race watches it and races the next.
- The bar under the header leads back to the room (_Back to the room_, or _Back to the race_) from
  anywhere in the app, even after a restart, and the set phrases work as in games. A room is
  deleted 10 minutes after its last player leaves, and 6 hours after it was made at most.

## Notifications

_Settings → App → Notifications_ (`/settings#notifications`) sets three kinds, on this device only
(they never sync), each off until switched on:

- **Live games**: someone took the game you posted, your opponent moved, or a game ended, while the
  app is in the background. The app shows these itself, so they need it running; while it is in
  view, the page says it instead.
- **Correspondence games**: your move ("Your move against Swift Knight"), your invitation taken and
  the end of a game, even when the app is closed: the relay pushes them through the browser's push
  service while you are away from the game.
- **Daily reminder**: "Time for some chess" at the time you choose (in quarter hours, in the
  device's time zone; 18:00 at first), unless you have trained that day. The relay pushes it too:
  the app tells the relay when a training day is recorded, and keeps the reminder in step with the
  device's time zone each time it starts.

Each switch asks for the browser's permission as it goes on. Where the browser cannot show them, the
card says why: on an iPhone or iPad, only the app added to the Home Screen can show notifications
(_Share → Add to Home Screen_, then switch them on there); notifications blocked for the site need
allowing in the browser's site settings; and a browser that cannot be reached with the app closed
offers only _Live games_. Clicking a notification opens its game (or Home, for the reminder), in a
window of the app already open if there is one. Switching the reminder off deletes it from the
relay, and switching both pushed kinds off ends the browser's push subscription.

## Arcade

Eleven games that are not puzzles, each with a score to beat. Each is set up as a game against the
computer is on Play: a setup card with its choices and your best so far, the board as the game will
start beside it on wide screens, and on phones the form alone with _Start_ pinned above the bottom
bar.

- **Hand & Brain** — full-strength Stockfish as your partner: you call the piece and it finds the
  move, or the reverse, and every call is graded against the engine's best. The score is your
  accuracy times the engine level, in full from 30 calls; a game resigned before 10 calls is not
  scored.
- **Daily Opening** — a Wordle for the 3,800-line opening book, with a streak and a result to share
  (the share sheet on a phone, a copy elsewhere). Every move of a guess is marked by a tint, a glyph
  and words; a game started before midnight keeps its day, and a day played is never played again.
- **Who Stands Better?** — ten quiet positions from the classic games, with White or Black to move,
  judged on a slider in tenths of a pawn against the engine's verdict: within 0.3 is spot on, each
  pawn of error costs 30 points.
- **Odds Ladder** — full-strength Stockfish starting without a queen, then a rook, a knight, a
  bishop, a pawn and finally nothing. Wins, draws and losses are kept per rung.
- **Army Draft** — both sides buy an army from a points budget and fight with it.
- **Fortress** — hold a clearly worse position, with the evaluation as a health bar; the last of the
  twenty moves is graded like the others before the position counts. Each position held scores the
  engine level.
- **Engine Says** — a Simon game played with the moves of real opening lines, at a normal or a slow
  pace; replay a whole line and its moves stay in the score as a new line starts.
- **Blindfold** — a full game with the pieces (and the captured material) hidden and three peeks. A
  win is 100 and a draw 50, plus 15 for each peek to spare, times the engine level; a loss scores
  nothing.
- **Simul** — two to eight games against Stockfish at once, each on its own board, at one strength
  or rising a level per board, as White, Black or both. With clocks, every board has a clock for each
  side, as in a clock simul: yours runs on every board where it is your move, even while you play
  another, and the engine's only while it thinks. Small boards show every game (on a phone a strip
  of board numbers sits under the big board too); tap one or press `N` for the next board waiting for
  you. Each win scores its board's level, a draw half of it. Leaving a simul in play asks first and
  resigns the boards still going. The setup shows the boards as they will start (your side on each
  and the level across from you), changing as you choose.
- **Arbiter** — a stretch of a classic game replays at speed, and then one move breaks the rules. Call
  it (the button, or Space) before the next move would have come. Eighteen kinds of illegal move in
  three tiers: in rounds one to three a piece moves in a way it never can (a knight off its L, a bishop
  going straight, a pawn backwards or taking straight ahead); in rounds four to seven the right movement
  comes where it is not allowed (a piece jumping another, a late double step, a pawn left
  unpromoted); from round eight on it is what the king's safety and the move order forbid (a pinned
  piece moving, a king walking into check, a check ignored, castling past an attack, en passant too
  late, one side moving twice) — with now and then a kind from the tier below. Every call is answered
  with the rule and the squares that show it. Rounds speed up; calling a legal move or letting the
  illegal one pass is a strike, and three end the run. The replay pauses when the page is hidden, and
  a pause covers the board. Slow pace gives each move nearly twice as long. The score is the illegal
  moves caught.
- **Ghost Knight** — an enemy knight hides on the board and shows itself every third move. Your
  squad moves by the ordinary rules, one move a turn; the knight never jumps onto a square you attack
  and takes any piece you leave unprotected within its reach (which shows where it is). Catch it by
  landing on it — a rook or bishop that runs into it on the way stops and takes it — or corner it so
  every square it could jump to is covered. Shaded, the board marks every square it could be on;
  unshaded, you track it yourself for double points. Five hunts, each harder than the last (two rooks
  and a bishop up to rook, bishop and knight), three lives; a catch scores 10 plus a point for each
  move to spare.

The games against the engine end with "Play again" (the same settings) and "New game" (the setup),
hand the game to the analysis board from your side, copy its PGN, and follow focus mode. Odds
Ladder, Army Draft, Blindfold and Simul games go to the game log as arcade or simul games, apart
from the engine ladder and the Play results.

## Analyze

- Multi-line engine analysis with an evaluation bar, a full **variation tree** (promote, delete,
  annotate, comment, PGN export with variations) and ECO opening names.
- A **position report**: structure, king safety, open files, outposts, loose pieces and plans for both
  sides.
- A board editor (castling rights, en passant, impossible piece counts refused), optional Lichess
  tablebase lookups ("mate in N" counts moves, the DTM in half-moves is in the tooltip), **shareable
  links** (the game travels in the URL, opening at the shared move — a variation included), and an
  **analysis library** with named collections and Lichess study import; a reopened entry is updated
  rather than duplicated, and every delete or reset asks first.
- **Game review** with an evaluation graph, **key moments explained in words** — hanging pieces,
  forks, pins, missed mates, each linked to the lesson and the puzzle theme — and a choice of depth.
  The engine sees each position with the moves that led to it (so it knows about repetitions), and a
  move that looks like a slip is compared with the engine's choice once more, both moves in one
  search at depth 14 or more, before it is called one — so a deep sacrifice is not marked down for
  what a shallow search cannot see.
- **Time management.** A reviewed game with clock times (`[%clk]`, as Lichess and chess.com write
  them and the relay's games carry, or `[%emt]`) has a time chart under the review when at least
  three moves in four, and at least six, have a reading: the time each move took (from consecutive
  readings and the increment), White's above the line and Black's below, the review's inaccuracies,
  mistakes and blunders coloured (with a dot, so a quick mistake still shows), the moves begun short
  of time shaded, a cursor on the current move and a readout on hover. Up to three sentences read
  it ("3 of your 4 mistakes came with under 30 seconds left.", "Black spent 6 minutes on move 14,
  Nxe5."), and a table, folded away, lists every time, each move a button that goes to it. Short of
  time is under a tenth of the starting time, from 10 seconds in bullet to a minute. Correspondence
  games have no chart.
- **Fix your mistakes.** _Fix your mistakes_ under a review steps through your inaccuracies,
  mistakes and blunders, each from the position before it: "You played Nc3, a blunder. Find a better
  move." When the game does not say which side was yours, it asks first. The engine's own move is
  right at once; any other is judged by a short search against it, and counts when it is as good,
  or nearly. A move that does not count, the one played in the game among them, gets a red arrow and
  another try. _Show the move_ plays the engine's move with the review's explanation, its line and a
  lesson link. Progress shows as "2 of 5", and the summary lists each with what you found, and
  offers to save the ones you were shown as puzzles, or to try them again. Meanwhile the analysis is paused and
  everything that could give the answer away is hidden (the engine, the evaluation, the move list,
  the explorer, the cards and the review), and ← → Home End do nothing; _Back to the game_ puts the
  engine, the board's side and the move back as they were.
- **Human moves**, a card switched on from the card itself: what players of a rating you choose
  (600 to 2600, in hundreds; remembered) play in the position, from Maia, the human-like model. Up to
  five moves, each with its share and the engine's verdict (_Best_, _Good_, _Inaccuracy_, _Mistake_
  or _Blunder_, with the score); a move in the list plays on the board. When the move players choose
  most is a mistake or a blunder, the card says so and why: "A trap at 1500: most players choose
  Bxd1 (80%), a mistake. Allows a forced mate in 2 after Bxf7+." The model is the human-like
  opponent's (a one-time download of about 25 MB, offered on the card with its progress and a
  _Stop_). The engine judges the moves only once its own analysis of the position is idle, in one
  search at depth 12, and gives way whenever anything else needs it; with the engine off, _Check
  these moves_ asks for the verdicts. Not shown while you analyse a game yourself, while fixing
  mistakes, or for Chess960.
- **Analyse together** (`/analyze/together/<id>`): a shared analysis board for up to eight people
  with its link. Two ways in: _Analyse together_ at the end of a game against a person on the relay
  (both players, and anyone watching who presses it, reach the same room with the game's moves;
  when the other side is there already, the button reads _Join the analysis_), or _Analyse with a
  friend_ on the analysis board, which makes a room from the game on the board, variations
  included, and gives its link (the share sheet on a phone, copied elsewhere; quick search finds it
  as _Analyse together_). Whoever opens the link joins under their name.
  - Everyone can play moves and variations, delete a variation, make a line the main line, and draw
    arrows and circles that everyone sees: right-click on a computer, or _Draw_ (tap a square, then
    another for an arrow or the same one for a circle, in four colours; _Clear drawing_) on a phone
    or from the keyboard. The relay takes only legal moves, in standard chess and Chess960, up to
    1,000 moves in a room.
  - _Follow_ (on at first) keeps your board on the shared position; switched off, you look around
    alone, a line says where the others are, and _Back to the shared position_ returns. A status
    line says what the others do ("Swift Knight played 1… c5."), with the move sounds.
  - Each device runs its own engine, with its lines and the evaluation bar, and can switch it off.
    The keys are Analyze's (← → Home End, F to flip). _Open in Analyze_ copies the whole tree to
    your own analysis board. The members (who is here), the set phrases and the link are beside the
    board, which stays in view on wide screens while they scroll past, and the bar under the header
    leads back to the room. A room is deleted 10 minutes after its last member leaves, and 6 hours
    after it was made at most.
- **In your games**: every game in My games that reached the position on the board (the same
  pieces and side to move, by any order of moves), with the opponent, the date, the result and the
  move played next ("then 12. Nf3"), and how often each next move was chosen. Five show, then _Show
  all_. A game opens on the move played next, asking first when the board holds work not yet saved.
  Its index is built the first time it is needed, in small steps that keep the page responsive, and
  again only when the games change.
- **Analyze it yourself first**: before the engine's review, go through the game with the engine,
  the explorer, the tablebase and the position report out of sight; mark the moves where the game
  turned (M, or the button) and play what you would have played instead. "Check with the engine" then
  runs the review and scores you: the turning points (mistakes and blunders, either side) you found —
  on the move or one move late — the ones you missed, false alarms (a mark on an inaccuracy is
  neither), and each of your moves against the engine's. Offered on the analysis board, at the end of
  a game against the engine and next to each unreviewed game in My games.
- **Import games** by pasting or opening a PGN (ChessBase-style `1.e4` numbering, chess.com clock
  tags, evaluation symbols and 4-field FENs included; an illegal move is named and the moves before
  it can be loaded), or straight from a Lichess or chess.com username, Lichess's games with their
  clock times. Variants other than Chess960 are skipped.
- **Chess960.** A Chess960 PGN (from Lichess, chess.com or the app) or FEN (castling rights as `KQkq`
  or by file, such as `HAha`) loads with its position named over the board (_Chess960 · position
  N_), and the engine (in its Chess960 mode), the variation tree, the game review, _Fix your
  mistakes_, self-analysis, the board editor (a _Chess960_ box for the castling rights) and the PGN
  export follow its rules; a share link carries the game as PGN. The opening explorer, human moves
  and _Add line to repertoire_ are for standard chess and hidden. The position report and the move
  explanations read the position as standard chess does (castling aside), and puzzles and threats
  taken from a Chess960 game come only from moments where neither side can still castle.

## My games

Import your games (Lichess and chess.com with time-control, colour and rated filters, or PGN), see
your **opening statistics** per colour, find where you or your opponents **left your repertoire**,
review every game in one go, turn the mistakes into puzzles and the threats you missed into
positions for the threat drill, analyze a game yourself before the engine does, and read the
**insights** — accuracy by
phase, the mistakes you make most, results by colour and opening — with a "work on" list
of lessons and themes. Rows resting on fewer than 3 games or 20 reviewed moves are greyed out.

The insights' **Time** section reads the reviewed games with clock times (those reviewed from My
games since 0.29): in how many you were short of time, the time per move and the share of it by
phase, and your mistakes and blunders per 10 moves when short of time against otherwise, with a
lesson to follow. _Time trouble_ joins _Work on next_ when mistakes come at least twice as often
short of time. Chess960 games are marked _Chess960_, open in Analyze and are reviewed like any
other, but stay out of the opening statistics.

## Home and Progress

- A first-run tour, your current course, and an **adaptive daily plan**: the daily puzzle and
  opening, rated puzzles — plus your weakest theme once it is clearly behind (20 or more attempts and
  15 points under your own accuracy) — the review queue, lesson recall, opening reviews, tactics from
  your repertoire's openings, what your games say to work on, the next lesson and the next rung of
  the endgame ladder, with a training-day streak. A returning learner sees the day first; the
  introduction is for newcomers.
- **What's new.** After an update, a returning learner finds a _What's new in 0.29_ card under
  _Today_ (which stays the first heading): the release's highlights, four at first and _Show all_
  for the rest, each leading to its feature, and _Earlier releases_ for the ones before. It shows
  once per version, until it is dismissed (in every open tab), and never on a first visit: the
  version a newcomer starts on counts as seen. _Settings → App → What's new_ lists the recent
  releases' highlights, newest first, with a link to the full changelog. The version last seen is
  kept on the device.
- **Progress**: rating history chart, a weekly summary (the last seven calendar days against the seven
  before, with the trend shown by an arrow as well as colour), solve statistics, strengths and
  weaknesses by theme (measured against your own accuracy), lesson completion, the game log with results per engine level and per human-like rating, arcade records, drill and
  rush records, **thinking skills** (threats named and met, blind-puzzle levels, the share of turning
  points caught in your own analyses, moves the blunder check held back), opening and puzzle review counts, and a reminder when a backup is overdue (shown once
  there is anything worth keeping — puzzles, lessons, openings or games — with a week's "Later").
  Solve counts, accuracy and solve time are lifetime figures, not just the last 300 attempts.

## Quick search

Ctrl+K (Cmd+K on a Mac) anywhere but in a text field, or the magnifying glass in the header (on
phones too, beside the theme button), opens a search of the whole app: pages and their sections,
Play's sections and the games for two (and _Race room_), lessons and courses, the built-in
repertoires and your own, puzzle modes and themes (those with at least 10 puzzles), skill and
endgame drills, the arcade, classic games, endgame studies, mating patterns, the reference (the
rules, notation, every glossary term and every FAQ question) and the Settings cards. Before you
type, it offers the 14 main sections.

- **Matching.** Accents, apostrophes and capitals are ignored ("reti" finds Réti, "queens gambit"
  the Queen's Gambit). Every word typed must match, at the start of a word, or inside one from four
  letters or with a digit ("960"); one typo is forgiven in a word of five letters or more whose
  first letter is right ("najdrof", "londn"). Words in the title count most.
- **Results** come grouped by kind, each with a heading and an icon, best first, at most 8 of a kind
  and 30 in all, with the letters found marked.
- **Keys.** ↑ and ↓ move (and wrap round), Enter opens, Esc or the close button closes, and the
  browser's Back closes it too; the focus goes back where it was, or to the new page. The shortcut
  again closes it. Screen readers meet a combobox over a list of grouped options, and hear how many
  results there are ("12 results", "No results for …") once typing pauses.
- It loads the first time it opens (or when the pointer or the focus reaches the button), and each
  list it searches arrives as it loads, so start-up carries none of it but the shortcut.

## Settings

Settings is in five tabs: **Appearance**, **Play**, **Engine**, **Sync & data** and **App**. Each
profile keeps its own settings (a new profile starts with those of the one it was made from), and
sync between devices can carry them; the engine's threads, the full engine download, the install
prompt and the notifications belong to the device, shared by its profiles, and never sync. The
address names the open tab (`/settings#engine`), so a reload or a shared link opens it again, and a
link to a card (`/settings#profiles` from the profile badge, `#lichess` after the Lichess sign-in, a
join link's `#sync=…`) opens the card's tab and scrolls to it. The tabs are one tab stop: the arrow
keys, Home and End move between them, and on phones they wrap onto two rows.

**Appearance.** _Display_: the colour scheme (_System_, the default, which is _Nightshift_ unless the device asks for
light; _Nightshift_, dark; or _Dayshift_, light) and
**move notation** — figurines drawn from the piece set (♘f3) or letters (Nf3), everywhere a move is
written. _Sound & vibration_: the sounds, their theme (which also picks the vibration patterns) and
volume, and vibration. _Board_: every Lichess board — the flat Brown, Blue, Green, IC and Purple,
and twenty pictures from Wood and Maple to Marble, Metal and Newspaper (each downloaded the first
time it is chosen, then kept for offline use; the picker shows small previews) — plus the app's own
Ice, Walnut and colour-blind-safe High contrast; nine piece sets from the Lichess collection (the
classic cburnett figurines, Merida, Chessnut, MPChess, Celtic, California, Maestro, Staunty and
Cardinal, each credited with its author and licence) shown as strips to pick from, coordinates,
legal-move dots, last-move and check highlights, animation, a **magnified dragged piece** with a
circle or square **drag target**, moving by tap, drag or either, and captured material beside the
player bars as the difference, every capture, or nothing.

**Play.** The defaults (always promote to a queen, auto-advance puzzles, keyboard move entry, coach
mode, the blunder check, the engine level for the next game), **premoves in live games** (on by
default), **focus mode**, which hides the header
and navigation while you play the computer (in Play, the simul and the arcade games), and
**single-key shortcuts**, which can be turned off. The puzzle rating reset or calibration (a button
with a confirmation; the rating history is kept), and the **human-like opponent**'s download, with
its progress, and a Delete that frees its 25 MB.

**Engine.** Review and analysis depth, the tablebase and opening-explorer lookups (the explorer needs
a Lichess account, connected under _Sync & data_), threads (on by default), the optional **full
engine** download with its progress, and a diagnostics panel with a speed test.

**Sync & data.** **Sync between devices** and the **Lichess account** (see below), backups,
**profiles** for several learners on one device, and the **storage meter** with _Reset everything_.
Backups export or import as JSON, **share a backup** straight to another device, or open a backup
file with the installed app. An import is checked field by field, then asks first: it shows the
backup's date and what it holds (puzzle attempts, imported games, saved analyses, custom
repertoires, the settings), offers to export the current progress, replaces everything in the profile
at once, and can be undone from the toast that follows. Backups since 0.24 (format 12) hold the
profile's settings (an older backup leaves them as they are); since 0.22 (format 11) they keep the rounds from the
Lichess puzzle history counted lately (so sync between devices counts a round two devices both
brought in once) and a random id of the profile's history (so a backup of the profile is known as
such, however long ago it was made); since 0.17 (format 10) they keep the Lichess puzzles waiting
in the review queue and which games went to Lichess; since 0.16 (format 9) they keep games against
the human-like opponent with its rating; since 0.15 (format 8) they carry the thinking-skill records
too; since 0.12 (format 7) they include the imported games and, on a device with several profiles,
carry the profile's name in the file name. _Reset everything_ clears this profile's progress,
repertoires, library, imported games and settings and the device's engine settings, a downloaded full engine included,
turns sync between devices off on this device first (so the synced copy and the other devices keep
their data), and disconnects the profile's Lichess account (withdrawing the permission); the other
profiles are kept, and the dialog says so. With sync between devices on, an import joins the backup
with this device's data and the synced data instead of replacing anything (an item that differs is
kept twice, the backup's version as "… (backup)"), and the dialog says that instead; the device
syncs first, so this needs a connection, and only what goes beyond the synced data is added — the
toast counts what it added. The settings stay as they are.

**App.** Installing the app, the badge of due reviews on its icon, the offline puzzle download (it
keeps going when you change page), the test lab, the version and _What's new_ (the recent
releases' highlights), and [**Notifications**](#notifications) for this device.

### The test lab

_Settings → App → Open the test lab_ (`/settings/lab`) is a single page for checking a device by hand:

- **Platform:** installed-app mode, service worker, online state, WebAssembly, workers, shared memory
  and cross-origin isolation, CPU cores, Web Audio, vibration, the app badge, Web Share (with files),
  Compression Streams, clipboard, the CSS features the layout relies on, colour-scheme and
  reduced-motion preferences, pointer type, viewport, language and the browser's storage estimate.
- **Storage:** the meter, the largest keys, and a button that fills local storage to the browser's
  limit to show the "storage is full" warning, with another to remove the filler. The filler never
  outlives the lab: it is removed when you leave the page and at every app start, and the limit it
  measured is what the storage meter in Settings shows from then on.
- **Sounds and haptics:** a button for every cue, with the sound theme, the volume and the switches
  to hand; the vibration patterns shown follow the theme.
- **Icons:** every icon at 16, 20, 24 and 32 px, on light or dark.
- **Controls and feedback:** every button, input, badge, stat, alert, toast and the dialog.
- **Board:** the board themes, the piece sets, highlights, arrows, check and the promotion menu.
- **Type and colour:** the colour tokens and the type scale.
- **Engine:** the diagnostics panel and speed test.
- **Errors:** a deliberate crash, to see the error page and its report link.

## Sync between devices

_Settings → Sync & data → Sync between devices_ keeps a profile in step across a learner's phone,
tablet and computer, with no account:

- **Turning it on** gives a **recovery phrase**: 12 words from the BIP-39 list (the first four
  letters of each are enough), shown with a QR code of a link that carries them. The dialog can
  copy the words or the link; any device that syncs shows the phrase again (_Show recovery phrase_).
- **Joining**: scan the code with the other device's camera — the link opens Settings there with the
  phrase filled in, and takes it out of the address at once — or choose _I have a recovery phrase_
  and type or paste the words (numbering, line breaks and capitals are fine; a mistyped word is
  named, and a checksum catches the rest). A device with progress of its own chooses whether it
  joins the synced data (_Keep both_, the default) or makes way for it, with an export offered first.
  _Keep both_ adds up what two devices did apart, and keeps the puzzle rating, with its chart, of
  the one that rated a puzzle last. A device restored from the other's backup is recognised by the
  history they share, so what they have in common is not counted twice.
- **What syncs:** progress, ratings, lessons, flashcards, review schedules, repertoires and their
  cards, saved analyses, imported games and the settings — everything a backup holds — so every
  device is ready to play as the learner left it. The engine's threads and full download, the
  install prompt, the notifications, the Lichess sign-in and the backup reminder stay on each
  device. A setting changed on two devices before they synced takes the value of the one that
  synced first, and a device joining takes the synced settings.
- **What syncs on this device:** a switch for each part — _Progress_, _Repertoires_, _Saved
  analyses_, _Imported games_ and _Settings_ — all on by default, and also offered before sync is
  turned on or joined. A part switched off stays as it is on the device and the vault keeps its own
  of it, for the other devices; switched on again, what changed on both sides meanwhile comes
  together, merged against the version the two last shared, so nothing is counted twice. Each
  device chooses for itself.
- **When:** a few seconds after something changes, when the app opens, comes back into view or back
  online, and every 5 minutes while it is on screen; _Sync now_ runs it at once. Tabs take turns.
- **Counted.** The card counts what is kept in step — puzzles played, lessons completed, the
  learner's own repertoires, repertoire moves in review, saved analyses and imported games, of the
  parts the device syncs — and, after each sync, says what came in and what went out: "4 puzzles
  and 1 analysis from your other devices; 2 settings sent." Turning sync on counts the settings
  changed from their defaults, joining says what came in, and importing a backup what it added.
- **Merging, not overwriting.** Each device remembers the version it last agreed with the relay and
  merges three ways: what only one side changed carries over, deletions included; logs (puzzle
  attempts, rating points, games, training days) join; counts add up both sides' increments; the
  puzzle review queue keeps the card with more misses and a repertoire card the latest review; a
  repertoire or analysis edited on two devices before they synced is kept twice, the other version
  named "… (other device)". Writes go by version, so two devices syncing at once never overwrite each
  other: the second merges again.
- **Private by design.** The data is encrypted on the device (AES-256-GCM, with keys from the phrase
  by HKDF-SHA-256) before it leaves; the relay stores scrambled bytes under a random name — no
  account, email or device name — and never sees the phrase. A relay that altered a vault, swapped
  one for another or rolled one back to an older copy would be caught. The phrase is the only key,
  so the join dialog asks for one from the learner's own devices: whoever made a phrase can read
  everything synced with it.
- **Ending it:** _Turn off_ stops syncing on one device (its data stays); _Delete synced copy_
  deletes the encrypted copy, and every device keeps what it has — the others say so at their next
  sync. A synced copy no device has used for a year is deleted, and one never changed after it was
  made, after 30 days. A synced copy takes up to 1,000 changes a day: past that, changes wait on
  the device and sync the next day, and the card says when. _Reset everything_ turns sync off
  on the device before clearing it.
- **Limits:** up to 1.4 MB of compressed data — far more than the app's own storage caps produce.
  Data from a newer version of the app pauses the sync until the device is updated. When this
  device's storage is full, syncing waits and says so: nothing it could not save is agreed with the
  other devices, and it carries on once there is room. Offline it waits for the connection; when
  the sync service cannot be reached, it says so and tries again a few minutes later.

While sync between devices is on, the Lichess account sync leaves repertoires and analyses to it.
The relay is a small Cloudflare Worker (or a Node server) in `relay/`; see `relay/README.md`.

## Lichess account sync

_Settings → Sync & data → Lichess account_ connects the profile to a Lichess account, which then keeps the
device in step with it — and, through it, with the learner's other devices. The sign-in happens on
lichess.org (the OAuth authorization-code flow with PKCE, which Lichess offers to apps without a
server): Lichess asks whether the app may read and write the puzzle activity and the studies, and
sends the learner back to `/settings/lichess`, which finishes the connection and starts the first
sync. A personal token made on lichess.org and pasted into the card works too — the card links to
the page with the permissions ticked — for a window that cannot finish the sign-in: an app on the
Home Screen of an iPhone or iPad, which iOS sends to Safari for it. Each part can be switched off:

- **Puzzles.** Every Lichess puzzle solved here counts on Lichess too: rated when it was rated
  here, a win only when solved without a hint (blind and rush solves go up unrated). Results from
  offline play wait in an outbox on the device — the Puzzles page says how many while offline — and
  go up in batches once it is back online. Lichess's puzzle history comes down: puzzles new to this
  device count toward the theme statistics and the training days, and the newest misses (up to 30
  per sync) are fetched whole and join the review queue, so they work offline too. The puzzle
  rating follows the Lichess puzzle rating (a switch of its own); results sent from here are
  recognised when they come back and never count twice.
- **Games.** A game finished here (drill positions excepted) is imported to the account, where the
  Lichess analysis board can look at it; the game log links to it. The app's record of the game
  travels with it in a `OpenFile` PGN tag, so another device reads the account's imported games
  back and restores its game log, newest first. Lichess imports the same text once, so a retried
  upload never doubles a game.
- **Repertoires and analyses.** Custom repertoires live as chapters of a private study (only you may
  share or export it) named _Open File · Repertoires_, saved analyses in one study per
  collection (_Open File · Analyses: Endgames_), continued in "(2)", "(3)" when a study reaches
  Lichess's 64 chapters. Each side is compared with how it looked at the last sync (a hash of each
  side's own version, so the small rewrites Lichess makes to a PGN never look like edits): new
  moves, comments, glyphs and arrows, a new name or side, and deletions come across either way; when
  the same item changed on both sides, both versions are kept — the Lichess one here as "…
  (Lichess)". Only a deletion made in the app deletes on Lichess: an item that went missing on the
  device any other way (a damaged save) comes back from its chapter, and a study deleted outright on
  Lichess is made again from the device. An item too big for a chapter (3,000 moves) or refused by
  Lichess stays on the device until it changes. A study nothing changed in is not read again. Names
  go to Lichess the way Lichess keeps them — a chapter's cut to 80 characters, a collection's
  without emoji and symbols — while the device keeps them as typed.
- **Ratings.** The account's game ratings suggest a starting rating for the human-like opponent
  (rapid, else blitz, else classical).

The sync runs on its own a few seconds after the app opens, when the device comes back online or the
app back into view, half a minute after results start to wait, and every 15 minutes while the app is
on screen; _Sync now_ runs it at once. One request at a time, as Lichess asks; a pause when Lichess
asks for one; nothing lost when it fails part-way — the outbox empties only as Lichess confirms. If
Lichess stops accepting the sign-in (withdrawn, lapsed, or short of a permission), the card says so
and offers to connect again — the sign-in is checked once more when the app opens; anything else
Lichess refuses is noted in the card while the rest of the sync goes on. Results and games the
device recorded without sending — before connecting, while disconnected or while that part was off —
are offered after connecting and when a part is switched back on (_Send them_ / _Not now_).
Lessons, flashcards, review schedules and settings stay on the device: a backup, or sync between
devices, moves those. While sync between devices is on, the repertoires and
analyses part pauses: those travel with it instead. The token is kept in this profile's storage on
this device, never in a backup; _Disconnect_ revokes it on Lichess. Importing a backup starts the matching over, so nothing on Lichess is deleted for
items the backup does not hold.

## Reference

A bar of sections that follows down the page and marks the one being read, then the rules of chess,
notation (SAN, PGN, FEN, engine evaluations), a searchable glossary — including
the rating and tablebase terms the app prints (Glicko-2, rating deviation, DTZ, DTM) — linked to the
step of the lesson that teaches each idea, and an FAQ. Every glossary term and every question can be
linked to (`/reference#glossary-zugzwang`), and a linked question opens; quick search uses these
links.

## Sounds and haptics

Eleven synthesized cues, built on a small Web Audio synth with no audio files, in three themes:

- **Standard** — a wooden thock for a move and a double thock for castling, a capture that lands like
  a hit (the loudest cue), an alarm for check, a fanfare for a promotion, a chime for a solve, a thud
  for a miss, an impact under a chord for game over — major when you won or drew, minor and sinking
  when you lost — a weighted tick for low time and a two-note ping for notifications.
- **Soft** — the same cues halved and rounded off, for quiet rooms.
- **Retro** — an 8-bit console's sound chip: a menu blip for a move, an explosion for a capture, a
  siren pair for check, a power-up run for a promotion, a coin and a flourish for a solve, four steps
  down and a buzz for a miss, a four-note cadence for game over (major for a win, minor for a loss),
  a hurry-up tick and a two-note question.

A **volume** slider sets how loud all of it is. Phones that support it get a matching vibration for
each cue — the Retro set's are shorter and buzzier — and sounds, theme, volume and vibration are all
in Settings; every cue can be tried in the test lab.

## Accessibility

Moves announced to screen readers, **keyboard board control** (arrow keys, Enter, Esc, or type a
square — the letters never trigger page shortcuts) with a "describe position" button and spoken
descriptions of view-only diagrams, keyboard shortcuts (press `?`; the single-letter ones can be
switched off in Settings for speech input and switch devices, while Enter, Space and the arrows keep
working), focus management, a
colour-blind-safe high-contrast board theme, high-contrast piece sets (**MPChess** and **California**), a soft sound
theme, reduced-motion support, a visible focus ring on every surface for keyboard use (none after a
click or a tap moved the focus; Windows High Contrast styles too) and WCAG-AA text contrast — checked by an automated axe-core sweep of every page, one of each
parameterised route included, in both colour schemes. Quick search is a combobox over a list
of grouped options with a live count of the results, and a premove made from the keyboard is
announced when it is set and when it is cancelled.

## App and offline

Web manifest, a hand-written Workbox service worker with an offline precache (app, engine, openings,
the first puzzle chunk of every band) and on-demand caching of the rest, an install prompt with iOS
instructions and screenshots in the install dialog, a monochrome icon for themed launchers, update
notifications, window-controls overlay on desktop, a **badge with due reviews**
on the app icon, **haptic feedback** on phones, and layouts for notches, small phones and phones held
sideways.

**An offline copy** comes with every release: `open-file-<version>-offline.zip`, the whole app —
every lesson and puzzle, the full engine and the human-like opponent — with a small launcher for
Windows, macOS and Linux. Unzip it and double-click _Start Open File_: it serves the app on the
computer itself, at `http://localhost:8064/`, and opens it in the browser, with no internet connection
and nothing to install. The address never changes, so a later copy finds the same progress; sync
and live games work from it whenever the computer is online.

## Privacy and network use

There is no sign-up: everything you do is stored in your browser, on your device. The app talks to
the network only when you ask it to — importing your games from Lichess or chess.com, the opening
explorer and tablebase lookups, which are off by default, the Lichess account sync once you connect
an account, which talks to lichess.org alone, sync between devices once you turn it on, which
sends the relay only data encrypted on the device, live games once you open Play, and
notifications once you switch them on. The opening explorer answers only a signed-in Lichess
account, so its lookups (to explorer.lichess.org) carry the sign-in of the account connected in
Settings.
A live game goes through the relay, which referees it: the relay sees the made-up names, the
ratings you choose to show and the moves, keeps a game until 10 minutes after it ends (a
correspondence game until a week after its end, and a year at most), and logs nothing. Anyone a
player sends a game's watch link to sees the game as it happens: the board, the clocks, the names
and the moves, never the phrases. A race room keeps its players' names and ratings and its last
race, and an analysis room its members' names and ratings, its tree of moves and the arrows and
circles drawn, until 10 minutes after the last one leaves (6 hours at most). For notifications pushed while
the app is closed, the relay keeps this browser's push subscription (the address of its push
service and its keys): with a correspondence game's seat until the game ends, and for the daily
reminder with the time, the time zone and the last training day, until the reminder is switched
off or the relay has heard nothing of it for 60 days (the app renews it each time it starts). A
push goes through the browser maker's push service, encrypted for this browser. Optional
downloads (the full engine, the human-like opponent, the whole puzzle set) come from the app's own
site (in the offline copy, from its own folder), and the human-like opponent runs on your device like the engine: no position leaves it. Backups are
files you keep. The page's Content-Security-Policy holds the app to that: it can connect only to
its own site, those four services (lichess.org, its explorer and tablebase, api.chess.com) and the
sync relay (whose live games use WebSockets), runs only its own scripts, and refuses to be shown inside another site's frame.

Browsers allow a site roughly 5 MB of local storage. The app caps what it keeps (300 puzzle
attempts, 200 imported games — unreviewed ones make room first — 500 saved analyses, 300 own-game
puzzles, 500 queued reviews, 20,000 remembered puzzle ids) and shows the total in Settings ("about
5 MB", or the limit the test lab measured on this device); if a write no longer fits it keeps running,
warns once, marks the failed key in Settings and saves everything again as soon as there is room.
Two tabs on the same profile stay in step: a change saved in one is picked up by the other. A saved
blob that cannot be read is set aside under `<key>:corrupt-<time>` rather than overwritten.
Reviews due a day or more away come due at 04:00 local time on that day.

## Compatibility promise

From 0.9 on:

- a backup made by any version imports into every later version (and a newer one imports with a
  warning, the fields this version does not know left out);
- data stored in the browser migrates on load, so an update never loses progress;
- share links (`#z=`, `#rep=`, `#wp=`) made by any version keep opening.

Fixtures from each earlier export format live in `src/store/fixtures/` and are imported in the unit
suite on every run.

## Under the hood

- **Static only.** Vite, React and TypeScript build to plain files. The engine is a WebAssembly
  worker and the puzzle database is a set of JSON chunks fetched on demand.
- **Free software.** GPL-3.0-or-later. The site ships its licences and the third-party notices
  (`licence.txt`, `licence-agpl.txt`, `notices.txt`), linked from the footer of every page with the
  credits: Stockfish and Chessground (GPL-3.0), Maia-3 (AGPL-3.0), the chosen piece set (the
  Classic pieces by default: Colin M.L. Burnett, CC BY-SA 3.0) and the Lichess puzzles and openings
  (CC0). The textured boards (Lichess, AGPL-3.0) are credited under the board picker.
- **Engine.** [Stockfish.js](https://github.com/nmrugg/stockfish.js) 19. The lite build, with
  Stockfish's small network (about 2 MB), runs by default and is far stronger than any human; the
  lowest playing levels are weakened in software (shallow search, sampling among several candidate
  moves, occasional random moves) so that real beginners can win.
- **Multi-threaded by default.** Multi-threaded WASM needs `SharedArrayBuffer`, which browsers only
  expose to cross-origin-isolated pages, and GitHub Pages cannot send the required headers, so the
  service worker adds the `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers
  itself. The first visit runs one thread (there is no service worker yet); from the next load on, the
  engine uses all but one CPU core (at most eight, four on phones and tablets). The headers also block
  cross-origin resources that are not CORS-enabled, and the app loads none: its only cross-origin
  requests are CORS calls to the Lichess and Chess.com APIs. _Settings → Multi-threaded engine_
  switches threads, and the headers, off from the next load. If the threaded worker fails to start,
  the one-thread engine takes over; if a worker dies later, mid-game, the page shows the error with a
  Retry button that starts a fresh engine.
- **Full engine (optional).** _Settings → Full engine_ downloads Stockfish 19 with its large network
  (99 MB) — the threaded or the one-thread build, whichever this device runs — and the service worker
  keeps it offline. It is noticeably stronger in deep, sharp positions, which analysis and game review
  gain most from. Until the download is complete, or where the full engine cannot start (a phone short
  of memory, say), the lite engine runs. Switching it off deletes the download.
- **Human-like opponent.** [Maia-3](https://huggingface.co/UofTCSSLab/Maia3-5M) (University of
  Toronto Computational Social Science Lab; the 5M-parameter model in half precision, 10.8 MB) runs
  in its own worker on [ONNX Runtime Web](https://onnxruntime.ai)'s WebAssembly build (14.2 MB). It
  reads the board from the side to move's point of view and scores every move for a player of the
  chosen rating facing one of the same rating; the app keeps the legal moves, turns the scores into
  probabilities and draws one. The two files come from the app's own site, are checked against their
  SHA-256 before they are kept (a cut-off download or a captive portal's page is refused), and live
  in a cache of their own that the worker reads directly — offline, and with or without the service
  worker.
- **Puzzles.** `scripts/import-lichess-puzzles.mjs` streams the Lichess puzzle dump, keeps
  well-established puzzles (at least 500 plays, popularity 70 or more) and reservoir-samples 6,000 per
  rating band with a fixed seed, keeping the ids of the previous set so histories stay valid. The
  trainer picks puzzles within ±150 of your rating and widens the window when it runs out of unseen
  ones.
- **Puzzle rating.** Glicko-2 (`src/lib/glicko.ts`, the system Lichess uses), one rating period per
  puzzle, with the puzzle's own rating deviation from the Lichess data. A solve is worth less with
  hints, when it was slow for the puzzle's size, or when the puzzle had been seen before; the
  deviation grows during long breaks.
- **Content is data.** Lessons, courses, drills, studies, repertoires and classic games are plain
  TypeScript. Test suites check that every FEN is legal, every accepted move is legal, every "mate in
  one" task lists exactly the mating moves and every line replays legally; `npm run lessons:preview`
  shows what the coach says to every legal move of a lesson; `npm run lessons:verify`,
  `npm run drills:verify`, `npm run studies:verify` and `npm run repertoires:verify` confirm the
  chess against Stockfish, in CI whenever the content changes and every week.
- **Shareable links** put the game in the URL fragment (`/analyze#z=…`, deflated with the
  Compression Streams API), so nothing is sent to a server and a link opens the same game at the same
  move. Repertoires (`/openings#rep=…`) and Woodpecker sets (`/puzzles/woodpecker#wp=…`) travel the
  same way.
- **Profiles** namespace the persisted stores, the settings included: the first profile keeps the
  plain `localStorage` keys, every other one gets `<key>:<profile id>`; switching reloads the app
  into the other namespace. The device's own settings (the engine build, the install prompt, the
  notifications) are kept once, under `open-file:device-settings`, for every profile.
- **Chess960.** The rules come from [chessops](https://github.com/niklasf/chessops)
  (GPL-3.0-or-later) in the app and in the relay, which referees online Chess960 games with it;
  standard chess keeps chess.js. Positions are numbered as is usual (Scharnagl's numbering: 518 is
  the standard start), and a castling move is the king taking its own rook, on the board and in
  UCI, as Stockfish writes it in its Chess960 mode; the SAN stays O-O and O-O-O.
- **Openings.** `scripts/import-openings.mjs` turns the lichess-org/chess-openings dataset (CC0) into
  a table keyed by position, so the analysis board can name an opening even after a transposition.
- **Move commentary and the coach** explain mistakes with rules, not generated prose: static exchange
  evaluation, fork and pin detection and the engine's own lines turn a swing into "Ne5 hangs the
  knight to dxe5", with a link to the lesson and the puzzle theme.

## Browser support

Any evergreen browser with WebAssembly and Web Workers: Chrome and Edge 111+, Firefox 121+, Safari 16.4+
(iOS 16.4+) — the floor set by the stylesheet (`color-mix()`, `:has()`, `dvh` units and container
queries). The threaded engine runs in all of them from the second load on (once the service worker
isolates the page) wherever at least three CPU cores are reported; elsewhere the one-thread engine
runs. If the engine fails to load, lessons and puzzles still work. The human-like opponent needs
WebAssembly SIMD (in all of them) and site storage on a secure connection; where a browser cannot keep
its files, the setup says so. Notifications need the browser's permission; those that come with the
app closed need the Push API and a service worker as well, and on an iPhone or iPad (iOS 16.4 and
later) only the app added to the Home Screen can show any. CI runs the end-to-end tests
on Chromium (desktop and a phone profile), Firefox and WebKit, and once more under the production
base path. The interface is in English only.
