# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.32.1] - 2026-10-26

### Fixed

- **Names that say what is shown.** A control's name now contains the text it shows, so a learner
  using speech can say what they see (WCAG 2.5.3, _Label in Name_):
  - a move in the game tree is named as written, then in words: "12. Nf3, knight g1 to f3";
  - with figurines on, a move's letter is inside the drawn piece, so an engine line's "Play Nf3"
    matches the move it shows;
  - the edge labels of the tap-to-move board (blind puzzles, the vision drill, the board editor)
    are drawn by the stylesheet, so a square's button is named by its square alone ("a8, black
    rook"), not by the label printed in its corner;
  - quick search's results are named title first, then what they show under it, then their kind:
    "Mate in 1, Deliver checkmate immediately, Puzzles";
  - a course's rows are named in the order they show, title first;
  - a simul's board buttons read "1 Your move" as they show it.
- **Figurines in print and in find-in-page.** A printed move shows its piece letter (printing leaves
  the drawn piece out), and the browser's find no longer paints the hidden letter over the piece.

### Changed

- **Dependencies.** axe-core 4.14 (which checks _Label in Name_ as part of WCAG 2.1 A), Playwright
  1.64.1, React 19.3.1, React Router 8.5, zustand 5.0.16, Chessground 10.5, Vite 8.3.5,
  Vitest 5.0.5, ESLint 10.13, typescript-eslint 8.72, knip 6.43, Prettier 3.9.10, jsdom 30.1.3,
  and the lockfile's undici, serialize-javascript, fast-uri and zod, which `npm audit` flagged.
- **CI.** The packages a browser needs from Ubuntu are kept in the Actions cache, so a run downloads
  only those that changed since, and each install has 15 minutes: a slow Ubuntu mirror held two
  WebKit shards past their 30 minutes on 26 October.

## [0.32.0] - 2026-10-26

Open File takes on the RFS brand ([Real-Fruit-Snacks/.github](https://github.com/Real-Fruit-Snacks/.github)):
its two themes, its one accent, its type and its mark.

### Changed

- **Nightshift and Dayshift.** The colour schemes are Nightshift, dark, and Dayshift, light: a
  near-black or a warm off-white page rather than pure black or white, borders in place of
  shadows, and no gradients. _System_, the default, follows the device, and is Nightshift unless
  the device asks for light. The header's theme button goes System, Nightshift, Dayshift, the
  order Settings lists them in, and search finds them under "night", "day", "dark" or "light".
- **Ember, once a screen.** The accent is Ember, `#FF6A3D` in Nightshift and a darker `#B83A0F` in
  Dayshift so that it passes WCAG AA on every surface the app puts it on. It marks a screen's main
  action: on a list of cards, the buttons are secondary now (the arcade's Play, except for the game
  of the day; the repertoires' Learn, Review and Practise; the games for two; the open games to
  join; a correspondence game's Play; each mating pattern's _Solve it_). A primary button glows on
  hover in Nightshift. Icon tiles on Home, What's new, the arcade and Play are neutral.
- **Links** are text with a thin Ember underline, Ember under the pointer; so are the cards'
  "Start: …" lines and the buttons that sit in running text, such as the footer's _Keyboard
  shortcuts_. A link styled as something else (a button, a tab, the skip link) keeps its own
  colours under the pointer.
- **IBM Plex.** Plex Sans for the interface and prose, and Plex Mono for the wordmark and the small
  capitals over cards, lists and tables. Both are part of the app (about 170 KB, under the SIL Open
  Font License, published with it as `licence-ofl.txt` and credited in the footer), so they work
  offline too. Body text is 15 px on a line height of 1.6, the way the brand sets it.
- **The rook tile.** The icon is the white rook on a dark rounded tile with an Ember rule under
  it: the app icons, the favicon, the shortcuts' icons and the header's mark.
- **Information is plain.** Inaccuracies and notes take the text colour, and the cursors of the
  evaluation graph and the time chart are grey, which shows on either half of the graph. Amber
  warns and prompts (a mistake, a hint, your move in a correspondence game, what is due), and
  Mint only ever means good.
- **The board** marks the selected square, its moves and the drag target in Ember, a hint in
  Amber, and right and wrong in Mint and red.
- **The README's pictures** are the new look, on the brand's flat colours.

### Fixed

- **The High contrast board** draws a lesson's hint, right and wrong squares in its own
  colour-blind-safe colours again; the ordinary board's were drawn over them.
- **The skip link** no longer turns its text the colour of its background under the pointer.

### Removed

- **The Black scheme.** Nightshift is near-black already; a learner who had chosen Black gets
  Nightshift, as does a backup or a synced copy that says Black, and the page paints it so from
  the first frame.

## [0.31.3] - 2026-10-13

### Fixed

- **The README** named the offline copy's launcher _Start Chess Trainer_; it is _Start Open File_.

### Changed

- **Tools.** Playwright 1.64 (and the browsers its tests run in), Vite 8.3, jsdom 30.1.2, knip 6.41,
  typescript-eslint 8.71.2 and the React plugin 6.1.2; the GitHub Actions that upload, download
  and set up Node move to their latest patch releases.

## [0.31.2] - 2026-10-13

The last of the relay's loose ends against abuse: connecting costs it nothing, chatter is written
in batches, and the few ways left to bother other players are closed.

### Security

- **Connecting writes nothing.** A socket's 10 seconds to say who it is are kept by a timer in
  memory rather than the room's alarm, so connecting to a game or a room no longer writes to the
  relay's storage. Before, each connection cost two rows of the free plan's daily writes.
- **Chatter is written in batches.** Phrases, offers and their refusals, who is here, and an
  analysis room's steps and drawings are written together at most every 5 seconds, or with the
  next move. Moves, results and anything a deadline depends on are still written at once.
- **No-shows wait.** A game aborted because a side never made its first move now counts against
  that side's address (a duel that never started, against the host whose rounds never came, or
  else the guest who never came): after 5 in an hour, it can post and join no game until the
  oldest is an hour old, and the games it has waiting are taken back. A seek that is never played
  can no longer keep catching people who tap Play.
- **Midnight starts nothing over.** The waiting room keeps the day before's salt for an hour into
  the new day, so an address's hourly counts carry across midnight.
- **A flood of connections cannot keep a player out.** A room takes at most 4 connections yet to
  say who they are from one address, and 20 in all; past those, the address holding the most
  gives way, so a player whose address has none waiting always gets in, even while someone floods
  the room to stop them reconnecting before a claim or making their first move.
- **Analysis rooms: only the host deletes moves,** so anyone with the link can no longer wipe the
  room's work. The People list marks the host.
- **Duel rounds name only the app's own classic games,** and the app shows any other name as "A
  classic game", so a duel's host cannot show their opponent text of their own.
- **No room is left behind.** A room whose first alarm cannot be set (the day's writes used up)
  is not kept, rather than staying in storage with nothing to delete it.
- **An optional secret for the counts.** With `QUOTA_SECRET` set on the relay
  (`wrangler secret put QUOTA_SECRET`), every count per address is kept under an HMAC with the
  secret, so even whoever holds the relay's database cannot try addresses against it.

### Changed

- **Rematches left.** At the end of the 30th rematch in a row, the result says no more rematches
  are left and offers _New opponent_, rather than refusing the click.
- **A refused post shows.** When the relay takes back a waiting game, Play shows why rather than
  still saying it is posted.

## [0.31.1] - 2026-10-13

The relay is harder to abuse. Nobody could read another learner's data or take their seat before;
now no single connection or address can fill the relay's database or spend its free daily
allowances for everyone either.

### Security

- **Sync: limits on new synced copies.** One address may make 5 synced copies a day and everyone
  together 50, and none is made once the relay's database reaches 400 MB, so the copies already
  there keep room to grow. Before, a script could fill the database in a few hundred requests, and
  the copies would have been kept for a year. An IPv6 address counts by its /64, the smallest block
  a home or phone is given. The counts are kept under a hash of the address with a salt replaced
  every day, and deleted within two days: the relay still stores no address. A relay that is full
  says so without spending anyone's allowance.
- **Sync: limits on writes.** A synced copy takes 1,000 changes a day (a learner's busiest day
  makes a few hundred), so one copy cannot spend the database's daily writes. Each change is also
  half as costly to the relay's allowance as before. A copy never changed after it was made is
  deleted after 30 days unused, not a year.
- **Reminders.** One address may set up 5 daily reminders a day.
- **Live games: the waiting room.** What one address makes (120 games paired, 5 correspondence
  invitations and 10 group rooms an hour) is counted in the waiting room's own storage, so
  connecting again no longer starts the count over. One address may have 5 games waiting, and
  private games have their own limit (300) apart from the 100 listed. A waiting game's id is now
  made from a secret only the poster's device holds, so nobody else can take its link over, even
  while the poster reconnects or after the relay restarts. The list of games goes out at most
  twice a second, and only when it changed.
- **Live games: the rooms.** A game or group room writes only what changed, so refused messages,
  repeated offers and steps to where the analysis already is cost the relay nothing; before, one
  connection could spend a day's writes in under an hour. A room takes 12 connections from one
  address and 6 on one seat, and at most 20 that have not yet said who they are (one more pushes
  the oldest of those out, so they cannot keep a player out of their own game). A connection
  refused more than 10 times in a minute is closed, and one to a game that is not there writes
  nothing.
- **Behind a firewall.** The relay's README explains how to put it on a domain of your own behind
  Cloudflare's rate limiting, the one guard against a flood of requests from many addresses.

### Changed

- **Sync waits out a daily limit.** When the relay says a limit lasts until tomorrow, the sync
  card says so and when syncing resumes, and the device stops asking until then (_Sync now_ still
  tries). Turning sync on when the relay takes no more new copies says why.
- **Daily reminders** say when this network has set up all the reminders it may today, or the
  relay asks to wait a minute, rather than that the relay could not be reached.
- **A game in a seventh tab** waits to connect until one of the six before it closes.
- **Rematches.** After 30 in a row, a new game starts from Play; the result dialog says so.

## [0.31.0] - 2026-10-12

Chess Trainer is now **Open File**: a name of its own, and an icon to go with it.

### Changed

- **A new name: Open File.** In chess, an open file is a column with no pawns on it, the road a rook
  takes into the game; the app is open too, free, open source and run on your own device. The name
  is in the header and the tab, on the home screen, on the offline copy (_Start Open File_), in
  backups, in the games the app writes (_Open File — …_ as the event and the site) and in the
  Lichess studies it keeps (_Open File · Repertoires_). Reference's questions say where it comes
  from.
- **A new icon.** A rook in an open file: a clear lane down a faint board, in the same greens as
  before. The header draws it in the theme's accent, and the home-screen, maskable and monochrome
  icons and the favicon are drawn from it.
- **A new address.** The repository is `Real-Fruit-Snacks/open-file` and the site
  `real-fruit-snacks.github.io/open-file/`. The relay is a Worker of its own, `open-file-sync`, with
  a database of its own, made on its first deploy.
- **Stored under the new name.** What the app keeps on a device (`open-file:` in local storage, the
  `open-file-` caches), the PGN tag that records a game's details on Lichess (`OpenFile`) and the
  synced vaults (an `OFS1` header, keys derived for Open File) all carry it. Nothing kept under the
  old name is read.

### Fixed

- **Setup screens.** _New game_ during or after a game brings the setup's title into view and
  keeps it there while the page settles around it (the preview board taking its size, a scroll
  still under way), rather than only when the page was scrolled past it.
- **Content checks.** The Stockfish checks of the lessons and studies run in a process of their
  own again: in the faster test pool 0.29 moved them to, the engine could not be shut down and
  every check failed at its end.
- **The icon on iPhone and iPad.** The home-screen icon has square corners for iOS to round, so no
  black shows in its corners.
- **README screenshots.** The script that takes them clicks _Continue_ where the repertoire trainer
  stops on a note, and reads the trainer's arrow before playing the move rather than after.

## [0.30.1] - 2026-10-12

The online pages get the polish the rest of the app had in 0.30, and its last loose ends are tied
up.

### Changed

- **Online pages.** Watching a game, a live game, a puzzle race room, a game for two and an analysis
  room read as every page does when there is nothing to show yet, or any more: their place in the
  app (_Play / Watching_) and a title on the page's left edge, then why (a game over and gone, a
  room closed, a seat that is not this device's) or how the connection is going, and the way back,
  rather than a card alone in the middle of the page. A correspondence invitation is laid out the
  same way, its title the page's and the details in a card under it.
- **Puzzle race rooms.** Until the room answers, the page says it is connecting and nothing more:
  no list of nobody, no button to join and no link to a room not yet found. In the standings and
  the places the row marked as yours keeps its score off its edge, and the note on the chosen
  format stands apart from the choices above it.
- **Games for two on a phone.** The score shows once, in the line above the board; the panel under
  the board opens with how the round stands.
- **The end of a game.** The ways on (_Show the board_, _Analyze game_, _New opponent_, _Rematch_
  or _Play again_) come in even rows, two side by side and the main one the full width under them,
  after a game against the computer, a live game and a game for two, rather than in a row that
  wrapped wherever it ran out of room.
- **Analysis rooms.** On wide screens the board stays in view while the panel beside it (the moves,
  the engine, the people, the invitation) scrolls past. The line for what the others play and draw
  says so until there is news (or that nobody else is here yet), rather than standing empty.
- **Simul.** The setup shows the boards as they will start, beside how it works: how many, the side
  you play on each and the level across from you, changing as you choose.
- **Setup screens.** What is still getting ready (the engine, Engine Says' opening book, Arbiter's
  classic games) is said in one place on every setup screen, at the start of the bar with _Start_;
  _Start_ stays usable where the game can wait for it.
- **Tests.** The accessibility sweep loads each page once and checks it in all three colour
  schemes, in full in the light one and for colour in dark and black (contrast, and links told
  apart from the text around them, the rules a scheme can change): 108 checks in place of 324, an
  eighth faster, and run in parallel, so CI's shards share them out rather than one shard taking
  the whole sweep. CI's Chromium shards run two tests at a time; the whole Chromium suite passes
  two at a time on two cores. New end-to-end tests cover the online pages with nothing to show, a
  race room while it connects, an analysis room's board on wide screens, the simul's preview, the
  end-of-game rows and a duel's score on a phone, and a unit test the daily puzzle at midnight.

### Fixed

- **Daily puzzle.** A page left open past midnight showed the new date and countdown but kept
  yesterday's puzzle until it was reloaded. It now moves on to the new puzzle once the old one is
  not being solved, and a solve that runs past midnight counts for the day its puzzle was.
- **Backups.** A backup picked again straight after _Cancel_ could leave no question on screen when
  the device was busy: each file offered now gets a question of its own.

## [0.30.0] - 2026-10-12

A polish pass across the app, on phones and desktops alike: games against the computer and every
arcade game set up on a screen of their own rather than in a dialog over the board, long lists you
can search, quieter puzzle tabs and drills, and a round of smaller fixes.

### Changed

- **A new game screen.** A game against the computer is set up in the page rather than in a dialog
  over it: the opponent as cards that say what each is, your colour and the game (standard or
  Chess960) as one-tap choices, then the level or the rating, the clock, an opening to practise and
  the help while you play. On wide screens a preview of the board stands beside the form — from the
  side you will play, the clocks as they will start, a Chess960 game's start drawn already, with
  _Another position_ to draw again — and the engine ladder sits under it. On phones the form has the
  screen to itself, scrolling with the page, and Start stays pinned above the bottom bar. _New game_
  during or after a game opens it again, with _Back to the game_; the focus moves to the screen and
  then to the board, which comes back into view at once.
- **Phones held sideways** scroll the page alone: the panel beside the board no longer scrolls in a
  box of its own; the board stays on screen while the panel passes beside it.
- **Scroll bars.** Boxes that scroll inside a page (move lists, the coach's conversation, a dialog's
  body) have a thin scroll bar in the theme's colours where scroll bars show, and the page keeps the
  room of its own while a dialog is open, so nothing shifts sideways.
- **Arcade: every game is set up the same way.** Hand & Brain, the Odds Ladder, Fortress, Blindfold,
  Engine Says, Arbiter, Ghost Knight, Who Stands Better?, the Simul and Army Draft are set up as
  Play's new game is: a card beside the board rather than over it, with the game in a line or two,
  its choices, your best so far and _Start_ at the foot. On wide screens the board stands beside the
  form as the game will begin, from your side and with the engine level you have chosen; on phones
  the form has the screen to itself, scrolling with the page, and _Start_ stays pinned above the
  bottom bar. After a game or a run, _Play again_ keeps the same choices and _New game_ opens the
  setup again, with _Back to the board_.
  - Hand & Brain's roles are two cards that say what each does (_Brain_: you say which piece moves
    and your partner finds the move; _Hand_: the other way round). Your colour is _White_, _Random_
    or _Black_ at a tap, here and in Blindfold, and Blindfold, Hand & Brain and Fortress describe
    the engine level chosen, as Play does.
  - The Odds Ladder's rungs are cards to choose from: the ones climbed, with your results, the
    current one, and the locked ones, each saying which rung to win first. _Choose a rung_ after a
    game brings them back.
  - Arbiter, Engine Says, Ghost Knight and Who Stands Better? set out their rules in a few short
    lines, and the pace or the mode is chosen on the setup (Engine Says' pace can still be changed
    during a run). Who Stands Better? shows the round's first position beside its rules.
  - Army Draft puts the budget first and the shop in one column, with the ready-made armies under
    a _Ready-made:_ label, _Clear_ at the end of their row and outlined − and + buttons; its preview
    of both armies stays in view. The Simul's setup, _New simul_, stands beside _How it works_.
- **Arcade.** A shorter introduction, and cards that lead with the game: its name beside its icon,
  with the minutes it takes under it, then what it is and what it trains. The Daily Opening stands
  out at twice the width, _New every day_, with its description; the other cards leave theirs to
  the game's page, and the grid closes up with no gaps. Home's Arcade card says it in one line too.
- **Long lists, shorter and searchable.** Learn, Classic games, the puzzle themes and openings and
  the endgame drills have a search field over the list, their filters beside it, and a count of
  what shows ("12 of 75 lessons"), which screen readers hear as it changes. A search matches every
  word typed, in any order, ignoring accents, apostrophes and punctuation ("queens gam" finds the
  Queen's Gambit); Escape clears it, and when nothing matches, _Show everything_ brings the whole
  list back.
  - **Learn** gathers the lessons under _All lessons_, with a level choice and _Hide finished_
    beside the search; all three are kept in the address, so Back returns to them. Each level says
    how many lessons it has, a card shows two lines of its summary (one on a phone), and the circle
    that marks a lesson done shows a faint tick, so it no longer reads as a radio button. On a
    course's page, a unit's steps sit in two columns on wide screens, each row ending in a chevron,
    and a unit that comes later has a plain background as well as its dashed edge.
  - **Classic games** are found by title, player, event, year or story, with the era, difficulty
    and status filters beside the field (kept in the address too). Each card shows three lines of
    the story, two on a phone, so the cards line up. Lasker–Thomas is now _The king hunt_.
  - **Puzzles → By theme** has a search and a group (_Every group_, or one with its number of
    themes), kept in the address. A theme you have tried five times or more shows how you do on it
    ("You: 72% of 40"), and _Work on this_ when that is below your own average.
  - **Puzzles → By opening** searches both lists, the search kept in the address. A repertoire's
    card says which other openings it takes in ("With …"), and _All openings_ is an index, a name
    and its number of puzzles to a row, in columns on wide screens, rather than a card each.
  - **Drills**: the endgame library is an index of rows rather than cards, with a tick for each
    rung climbed, a line on what the endgame is (left out on a phone) and your best or its
    difficulty at the end. Find an endgame by name, or narrow the list to one group (both kept in
    the address); each group's progress is a badge, green once the group is done.
- **Reference.** The bar of sections (_Rules_, _Notation_, _Glossary_, _FAQ_) follows you down the
  page and marks the section you are reading. The glossary's search counts the terms it shows and
  matches as the lists do, with _Show everything_ when nothing matches; the terms sit in one card,
  flowing down two columns on wide screens. The frequently asked questions are one card, with a
  rule between them. Disclosures across the app, these questions among them, open with a chevron
  that turns instead of the browser's own triangle.
- **Puzzles.** A puzzle's themes no longer show while you solve it, since they say what to look for
  (a fork, a pin): _Show the themes_ brings them up, and they appear by themselves once the puzzle
  is solved or missed. _Auto-advance after a solve_ sits at the foot of the session's card.
  - _Daily_ shows today's date and how long until the next puzzle ("the next in 5 h 12 min").
  - _Woodpecker_'s start card is laid out like the other puzzle cards, its text on the left and the
    size of the set as a choice under _Set size_.
  - _Blind_ shows _Level_, _Solved_, _Run_ and _Best run_ as four figures, and the lesson _How to
    see moves ahead_ is linked from the explanation at any time, not only before your first try.
  - _Due_, with nothing due, says when the next puzzle comes back, or that the next puzzle you miss
    starts the queue.
- **Drills.** An endgame drill sets out its task (your side, the goal, the technique and its lesson)
  in a card beside the board, with _Start_ under it, rather than over the board: the position can
  be studied before you start, and the moves played read "3/20" as you go. In Vision the choice of
  drill (_Moves_, _Captures_, _Checks_, _Guess_) heads the panel. In Vision and Coordinates the time
  bar appears with _Start_ rather than standing full before it, the _Start_ button no longer dims
  the board behind it, and Coordinates says where the square to find will appear, then _Time!_ at
  the end.
- **Patterns.** Larger diagrams, with their coordinates; _Spot it_ stands apart under the
  explanation as the line to remember, and a pattern you have solved offers _Solve it again_ in a
  quieter button, so the ones still to solve stand out.

### Fixed

- **Home.** The What's new card left no space before the card under it (Your progress, or the
  welcome for a newcomer), and the install and backup notices sat against the cards above and
  below them; all now have the same gap as the other cards, and the notices take no room when
  neither has anything to say.
- **Progress → Strengths and weaknesses.** A theme's name could run into its bar (Middlegame,
  Advantage, Capturing the defender) where the card is narrow. Each theme now has its name and figure
  on one line and the bar under both, and the two lists sit side by side only when there is room.
- **Progress → Recent puzzles.** Ratings and changes showed every decimal (1446.3100785634942,
  +15.3100785634942) and pushed the table off its card: they are whole numbers now, the change the
  difference of the ratings shown.
- **Dialogs** had two scroll bars side by side when their content was taller than the screen (the
  new game's, on a laptop): a dialog now scrolls in one place, its body, between its title and
  buttons.
- **Arcade.**
  - In Fortress, Hand & Brain and Blindfold, the engine's name on the board's bar kept the level of
    the last game while another was being chosen; it now follows the choice.
  - The Odds Ladder's board showed the engine's full army before a game, its queen included at
    queen odds; it now shows the chosen rung's position, without the piece the engine gives.
  - Blindfold's board showed the pieces before a game; they are now hidden, as they will be.
  - Fortress's board shows empty before a run, as the positions are drawn as it goes, rather than
    the last run's position.
  - Who Stands Better?'s start and its score stood alone in the page as centred cards, with no
    board; the board is there from the start now, and _Round over_ comes up over it as the other
    games' results do.
  - Daily Opening: your guesses had no place on the page until the first one, and a guess could be
    made only with Enter. The card of guesses is there from the start, with a row for each try
    still to come (six in all), and _Guess_ plays the first opening in the list. The hints spell
    out the ECO code ("Its ECO code starts with C."), and on a phone the board comes up higher.
- **Openings → a repertoire.** The start menu (_Start learning_, _Explore lines_, _Find gaps_…) lay
  over the board and, on a phone, hid it; it now sits beside the board (under it on a phone), the
  main button the card's width and the other ways in two by two, so the opening stays in view.
- **Analyze.** An engine line too long for its row ended in an ellipsis drawn over the pieces'
  figurines; it now fades out at the edge.
- **My games.** With no games yet, the list was one line of small print; it is now _No games yet_,
  with how to fetch or paste your games and a word on what their reviews give you. The list's title
  row has room under it.
- **Tabs and choices.** On a phone, the Settings tabs wrapped into ragged rows; they now come three
  and two, each row the full width. In the dark themes, the chosen option of a row of choices (and
  the chosen Settings tab) was darker than its track, as if pressed in; it is now lighter, lifted
  off it. The _Play_ button beside a move field is as tall as the field.
- **Page edges.** Placement, Recall with nothing due and the first visit to Puzzles ("Where should
  your puzzle rating start?") were centred in the page; they now start on its left edge, under the
  page's title, as every other page does.
- **Single-key shortcuts.** With _Single-key shortcuts_ off in _Settings → Play_, the H and N chips
  still showed on buttons that no longer answered to them: _Hint_ in a lesson, _Hint_ and _Next_ in
  Recall, _Next line_ in a repertoire, and _Next board_ and the line under _How it works_ in the
  Simul. They are hidden now, as on Puzzles.
- **Numbers.** Counts in the thousands read the same way everywhere now, with the app's separator
  (12,345). Some had none (the _Due_ tab's count, a theme's attempts on Progress, the backup
  reminder's puzzle attempts, a pattern's puzzles, _Forget all … moves_ in a repertoire, the
  offline download's progress) and some followed the browser's language instead (the opening
  explorer, the offline puzzle library, a backup's import summary, the long-link warning in
  Analyze). Ratings are written one way too, as your puzzle rating is (1,445): the rating chart, a
  puzzle's rating under _Recent puzzles_, a shared Woodpecker set, the Blind level, a Lichess
  account's puzzle rating and the starting ratings in Settings and on a first visit to Puzzles.

## [0.29.0] - 2026-10-12

Chess960 and correspondence games, premoves, games to watch, puzzle races for up to eight and a
board to analyse a game on together, with notifications when you are away; and in Analyze, what
people of a rating play, where a game's time went and a second try at each of your mistakes.

### Added

- **Premoves.** In a live game, a move made while your opponent thinks waits on the board and is
  played the moment their move arrives, or dropped quietly when it is no longer legal. Clicking
  elsewhere, or Escape, calls it off, and a premoved promotion becomes a queen. It works from the
  keyboard too, and screen readers hear it set and cancelled. On in every live game against a
  person, on the relay and on Lichess, except blindfold and correspondence games; _Settings → Play →
  Premoves in live games_ turns it off.
- **Watch a game.** _Copy watch link_ beside a game on the relay (the share sheet on a phone) gives a
  link at `/play/watch/<id>` that anyone can follow the game with as it happens: the board from
  White's side (it turns), both clocks, the moves, the offers and the result, with nothing to play.
  Watchers see a blindfold game's pieces, but never the players' phrases or an army before both are
  in. Up to 20 can watch a game, and the players see how many ("2 watching"). Duels and games on
  Lichess are not watched.
- **Correspondence games.** Chess or Chess960 over days, by invitation: in _Invite a friend_ the time
  control list has a _Correspondence_ group, 1, 2, 3, 5, 7 or 14 days for every move. _Create the
  link_ opens your board at once, with the link to send; your friend opens it and takes the other
  seat with _Join this game_ (once both seats are taken, the link only watches). Each side has its
  days for every move, and the board shows the days and hours left for the side to move. A deadline
  that passes loses on time (a draw when the other side cannot mate). There is no 45-second first
  move and no claim against a player who is away: players come and go. An invitation nobody takes
  in a week expires.
  - Play lists _Your correspondence games_ — the opponent, whose move it is and the time left —
    brought up to date from their rooms when Play opens and when the app starts, and the bar under
    the header says when it is your move ("Your move in 2 correspondence games.").
- **Notifications** (_Settings → App → Notifications_), set for each device on its own, each asking
  for the browser's permission as it is switched on:
  - _Live games_: someone took the game you posted, your opponent moved, or a game ended, while the
    app is in the background.
  - _Correspondence games_: your move, your invitation taken and the end of a game, even with the
    app closed: the relay pushes them.
  - _Daily reminder_: a note at the time you choose, in quarter hours, unless you have trained that
    day. The relay sends it, so it comes with the app closed.

  A notification opens its page of the app, in a window already open if there is one. On an iPhone
  or iPad only the app added to the Home Screen can show notifications, and the card says how.

- **Puzzle race rooms.** Race up to seven others on the same puzzles. The puzzle race's setup on
  Play offers _A room for up to eight_ beside _One opponent_: choose _Five rounds_ or a _Three-minute
  race_ and the puzzle rating, _Make the room_, and send its link (_Copy link_, or _Share link_ on a
  phone). Whoever opens it joins under their own name, and the host starts once at least two are in
  (_Start with 3 players_).
  - _Five rounds_: each puzzle comes up on every board at once, and the clean solves score by their
    order: 5, 4, 3 and 2 points for the first four, 1 for any other. The most points after five
    puzzles wins.
  - _Three-minute race_: as against one opponent, the most solved wins, then the fewer wrong
    answers, and three wrong answers end your race.
  - The standings change as everyone answers, and the end shows the places, a tie sharing one ("You
    came 2nd with 4 points."). The host can change the options and _Race again_ with new puzzles;
    whoever arrives during a race watches it and races the next. A host away for 30 seconds hands
    the room to whoever has been there longest. The bar under the header leads back to the room,
    and the set phrases work as in games.
- **Analyse together.** When a game against a person on the relay is over, _Analyse together_ takes
  both players, and anyone watching who presses it, to one shared analysis board with the game's
  moves. On the analysis board, _Analyse with a friend_ makes a room from the game on the board,
  variations included, and gives its link to send (up to eight people in a room). Everyone in it can
  play moves and variations, delete them, make a line the main line, and draw arrows and circles
  that everyone sees (right-click on a computer; _Draw_ on a phone or from the keyboard). Your board
  follows the shared position, or switch _Follow_ off to look around alone and come back with one
  tap. Each device runs its own engine, which can be switched off, and _Open in Analyze_ copies the
  whole tree to your own analysis board. The relay checks every move, in standard chess and
  Chess960.
- **Chess960 against the computer.** _Game: Chess960_ in the new-game dialog starts from one of the
  960 start positions, a new one each game, named on the page (_Chess960 · position 274_). Castle by
  moving the king onto its rook; both end on their usual squares. The engine plays by the same rules
  at every level, and take-backs, hints, clocks, blindfold and two players at one device all work.
  Coach mode, the blunder check, opening practice and the human-like opponent are for standard
  chess, so they are off. The PGN carries `[Variant "Chess960"]`, `[SetUp "1"]` and the start
  position, and _Analyze game_ opens the game by its rules.
- **Chess960 online.** A tile among the games for two on Play, and a game in _Invite a friend_, with
  a time control and a colour as for chess. The relay draws one of the 960 positions for each game,
  the same for both sides, the board names it ("Chess960 · position 192"), and the relay referees by
  Chess960's rules. Offers, takebacks, claims, premoves, the watch link and the phrases work as in
  chess, a rematch keeps the position with the colours swapped, and it can be played by
  correspondence. It is never posted on Lichess as well (the setup says so). Finished games go to My
  games as Chess960 games.
- **Chess960 in Analyze and My games.** A Chess960 PGN (from Lichess, chess.com or the app) or FEN
  (castling rights as `KQkq` or by file, such as `HAha`) opens with its position named over the
  board, and the engine's lines, the game review, _Fix your mistakes_, the board editor (a
  _Chess960_ box) and the PGN export follow its rules. Imports from Lichess and chess.com keep
  Chess960 games; other variants are still skipped. My games marks them _Chess960_, reviews them,
  and leaves them out of the opening statistics. The opening explorer, human moves and _Add line to
  repertoire_ are for standard chess, and hidden for Chess960.
- **Human moves** in Analyze. A card shows what players of a rating you choose (600 to 2600) play in
  the position: up to five moves from Maia, the human-like model, each with how often it is chosen
  and the engine's verdict (_Best_, _Good_, _Inaccuracy_, _Mistake_ or _Blunder_, with the score).
  When the move most players choose is a mistake, it warns you: "A trap at 1500: most players choose
  Bxd1 (80%), a mistake.", and says why. A move in the list goes on the board. The model is a
  one-time download of about 25 MB, offered on the card. The engine judges the moves once its own
  analysis of the position is done, or on request (_Check these moves_) when it is off, so the
  analysis is never slowed. Not shown while you analyse a game yourself, or for Chess960.
- **Time management.** A reviewed game with clock times has a time chart under its review: the time
  each move took, White's above the line and Black's below, with the review's inaccuracies, mistakes
  and blunders marked and the moves begun short of time shaded. A few lines read it for you ("3 of
  your 4 mistakes came with under 30 seconds left.", "Black spent 6 minutes on move 14, Nxe5."),
  and a table lists every time, each move a button to it. Games from Lichess and chess.com have
  clock times, and so do games played on the relay against the clock.
  - In My games, _Insights_ gain a _Time_ section over reviewed games with clocks: how often you were
    short of time, the time by phase, and mistakes per 10 moves when short of time against the rest.
    _Time trouble_ joins _Work on next_ when it costs you. Short of time is under a tenth of the
    starting time, from 10 seconds in bullet to a minute.
- **Fix your mistakes.** Under a review, go back through your inaccuracies, mistakes and blunders one
  by one, each from the position before it: "You played Nc3, a blunder. Find a better move." The
  engine's own move is right at once, and any other is right when the engine rates it as good, or
  nearly; a move that is not, the one you played among them, earns another try. _Show the move_
  plays the engine's move and says what went wrong. Progress shows as "2 of 5", and a summary at the
  end offers to save the ones you were shown as puzzles, or to try them again. The engine and
  everything else that could give the answer away stay out of sight, and _Back to the game_ leaves
  the board as it was. When the game does not say which side was yours, it asks.
- **In your games.** A card in Analyze lists the games in My games that reached the position on the
  board, by any order of moves: the opponent, the date, the result and the move played next, with
  how often each next move was chosen. A game opens on that move, asking first when the board holds
  work not yet saved. Its index is built in the background the first time it is needed.
- **Find the gaps in a repertoire.** _Find gaps_ on a repertoire's page, built-in or your own, asks
  the Lichess opening explorer what is played in each position where your opponent is to move, up to
  move 8, 12, 16 or 20. It lists the replies the repertoire has no answer to: those played in at
  least 5% of the games there, and in at least 50 games (10 among the masters). It uses Lichess
  players' games by default, since masters rarely play the replies club players meet, and the
  masters' at a tap. Each gap shows its line, the reply and how often it comes ("Played in 18% of
  12,400 games"), most often met first, and appears on the board; replies your other repertoires
  answer are listed apart. A summary says how much of the play the repertoire answers ("An answer is
  ready in 92% of games up to move 12").
  - It asks about one position at a time, waits when Lichess asks it to and says so, and stops on
    request (_Check the other 12 positions_ carries on); answers are kept for the session. It needs
    the opening explorer, and asks first: only the positions are sent.
  - _Add an answer_ puts the gap on the board with the reply played. The explorer's most successful
    answer is one tap, every answer played there is listed, or you play your own. A built-in
    repertoire is copied first ("Italian Game (my copy)"), and your progress moves to the copy.
- **Quick search.** Ctrl+K (Cmd+K on a Mac), or the magnifying glass at the top of every page,
  phones included, finds pages and their sections, lessons and courses, openings (yours too), puzzle
  themes and modes, drills, the arcade and the games for two, classic games, endgame studies, mating
  patterns, the reference (rules, notation, every glossary term and question) and the Settings
  cards. Results come grouped by kind, best first, with the words found marked; ↑ and ↓ move, Enter
  opens and Esc closes. Before you type, it offers the main sections. A word matches by its start,
  accents and apostrophes do not matter ("reti", "queens gambit"), and one typo in a longer word is
  forgiven ("najdrof"). Screen readers hear the results as a list, and how many there are. The
  search loads the first time it opens.
- **What's new.** After an update, Home tells a returning learner what the version brings, in a card
  under _Today_, each item leading to its feature, until it is dismissed. A first visit has no news.
  _Settings → App → What's new_ lists the recent releases, with a link to the full changelog.

### Changed

- **The opening explorer needs a Lichess account.** Lichess now answers explorer lookups only for a
  signed-in account, so lookups had stopped working. Each now carries the sign-in of the Lichess
  account connected in Settings; without one, the explorer card and the gap finder say how to
  connect it, and the explorer's switch says so before it is turned on. The explorer is asked at
  explorer.lichess.org, the address Lichess documents for it, which the page's security policy now
  allows in place of explorer.lichess.ovh.
- **The relay** runs Chess960 games (on chessops, its second package), correspondence games,
  watching, race rooms, analysis rooms and push notifications. A finished game's analysis room is
  made by the game's own room, with the game's real moves, under an id derived from the game's.
  Deploy it before the app (`npm run relay:deploy`): the deploy adds the Durable Object class of
  race and analysis rooms, `LiveGroup` (migration `live-v2`), and a cron every 15 minutes that sends
  the daily reminders. The Worker makes its push tables in D1, and its
  own key pair for Web Push (VAPID), the first time they are needed: there is nothing to set up.
- Games played on the relay against the clock go to My games with the clock after each move
  (`[%clk]`) and their `TimeControl`, and games imported from Lichess now come with their clocks,
  so their reviews show how the time was spent.
- A game's own link (`/play/online/<id>`), opened by someone without a seat in it, shows the game to
  watch rather than _No seat in this game_.
- A glossary term or a question in the Reference can be linked to (`/reference#glossary-zugzwang`);
  a linked question opens.
- In windows just wide enough for the header's links (900 to 1199 px), the install button stays in
  _Settings → App_ and on Home's banner, and below 1080 px the logo stands for the name, so the
  links, search and theme buttons always fit.
- The message after the human-like model's download mentions human moves in Analyze too.
- The icons are drawn from an SVG sprite that the build puts into `index.html`, rather than from the
  start-up code. That took 2.7 KB off it, which makes room for this release's own start-up parts
  (quick search's shortcut, the checks for rooms and correspondence games): 44.0 KB in all, against
  45.3 KB in 0.28.
- The unit tests run in Vitest's `vmThreads` pool, in about half the time; the relay's, the build
  scripts' and three files that need a process of their own run on `forks`. CI splits each
  browser's end-to-end tests across runners, four for the Chromium projects and three for Firefox
  and WebKit, and merges their reports into one. The 0.29 end-to-end tests run in Firefox and WebKit
  too.
- The service worker's precache budget rises from 7.5 to 7.75 MB: the release's features add about
  0.25 MB, and all of them work offline from the first visit (7.63 MB in all).
- THIRD_PARTY_NOTICES.md lists chessops (GPL-3.0-or-later), which gives the app and the relay
  Chess960's rules, and @badrap/result (MIT), which chessops uses.

### Fixed

- In the repertoire editor, a castling move picked in the explorer card is played even when the
  explorer writes it as the king taking its rook (`e1h1`).

## [0.28.0] - 2026-10-11

Play, rebuilt: one page for every game — a person online, a friend by link, the computer — and five
of the arcade's games to play against a person, among them a puzzle race on the same puzzle at the
same moment.

### Added

- **Games for two.** Five of the arcade's games against a person online, each posted from its own
  tile on Play with the options the poster chooses:
  - **Puzzle race.** The same puzzle on both boards at the same moment, near a puzzle rating the
    poster picks (600 to 2400). A wrong move is out of the round; the first clean solve takes it, and
    the first to two rounds wins (_Best of three_). With _Best of three, 15-second window_, a clean
    solve within 15 seconds of the first shares the round. With _Three-minute race_, both get the
    same run of puzzles, getting harder, each at their own pace: the most solved in three minutes
    wins, fewer wrong answers breaks a tie, and three wrong answers end a player's race. When a round
    ends, the solution plays out for whoever did not find it.
  - **Arbiter duel.** The same stretch of a classic game replays on both boards, then a move that
    breaks the rules. The first to call it (the button, or Space) takes the round; a call on a legal
    move is out of it. First to three rounds, at a normal or a slow pace, faster each round. After
    each round the board shows the rule that was broken.
  - **Who Stands Better? duel.** Five quiet positions from the classic games, judged on the arcade's
    scale against a 30-second clock. A judgement is locked in for good, and the other player sees
    only that it is in; then the engine's verdict and both scores show. Up to 100 points a position,
    as in the arcade; the higher total wins.
  - **Army Draft.** Both players buy an army from the same budget (20, 30 or 39 points) within two
    minutes, neither seeing the other's; an army is drafted for whoever has none when the time is
    up. The game then starts from the two armies, with a clock as in any game.
  - **Blindfold.** A real game with the pieces hidden for both: moves typed or played on the hidden
    board, the last move in words, and three two-second peeks each. Each player sees how many the
    other has used.
- **Duels** (the race, Arbiter and Who Stands Better?) need no clock. The poster's device deals the
  rounds, the relay checks them and sends the same to both, and each round starts on both boards at
  once after a three-second countdown. Times are measured on each device, from the moment the round
  appears there. The score stays in view (over the board on a phone); each round's result stays up
  for a few seconds, with what each player did, and the rounds played are listed beside the board. Resign, rematch, the set
  phrases and focus mode work as in a game of chess. A duel that has not started within a minute is
  called off, and so is one whose rounds the host's device cannot prepare (the puzzles out of reach
  offline, say), with the reason.
- **Invite a friend** to any of the games, not only chess: the link opens the game for them.
- _Play a person_ on the arcade's Army Draft, Blindfold, Arbiter and Who Stands Better? pages, and a
  link to the puzzle race from Puzzle Rush. Each game's setup on Play links back to practising alone.
- Army Draft and blindfold games played online go to My games like any other, named for their game
  ("Army Draft · 30 points · 5+3"); an Army Draft game keeps its drafted start, so the review
  replays it from there.
- Leaving a game against the computer half-played — a link, the navigation, closing the tab — asks
  first.

### Changed

- **Play is one page** (`/play`). _Play a person_: your colour and a time control at a tap, or
  _Invite a friend_. _Play the computer_: a new game, or _Pass and play_ at one device. Then the open
  games — chess and the games for two, each with its icon and options — the games for two, and your
  name online. Posting, waiting and joining all happen there; the separate waiting room is gone.
- The game against the computer is at `/play/computer`. Old links (`/play?fen=…`, `/play/online`,
  join links) still lead where they did.
- Army Draft's budget, prices and placement, and Who Stands Better?'s scale and scoring, are the
  relay's own rules now (`relay/src/live/army.mjs`, `duelRules.mjs`), so a game scores the same
  alone and against a person. The army shop is one component in the arcade and online.
- **The relay** knows the new games: a posted game carries its kind and options, a game room runs
  the draft, the peeks or the duel, and the rounds a host sends are checked before they go on.
  Deploy it before the app (`npm run relay:deploy`): an older relay takes only games of chess.
- The start-up code budget rises from 45 to 46 KB: Play's new routes (the hub, the duels and the
  redirects from the old addresses) and their icons bring it to 45.3 KB.
- CI runs the 0.27 and 0.28 end-to-end tests in Firefox and WebKit too.

## [0.27.2] - 2026-10-11

Openings at your own pace: a note on your move stays up until you have read it.

### Fixed

- **Learning a repertoire (Openings), the note on your move no longer vanishes.** The opponent's
  reply came 0.45 seconds after your move and replaced its note. Now, after a move with a note,
  the trainer waits: **Continue** (or Enter, or →) plays the reply. A move without a note gets its
  reply on its own, as before.
- A finished line no longer moves on to the next after 1.4 seconds, which took the last note and
  the line's result with it. **Next line** (or N, Enter or →) starts it. _Continue_ and _Next line_
  take the keyboard focus without scrolling the page.

## [0.27.1] - 2026-10-11

A polish pass over every page, on a computer, a tablet and a phone, in the light and dark themes.

### Changed

- **Course steps without a doubled label.** "Continue: Check, checkmate and stalemate" instead of
  "Continue: Lesson: Check, checkmate and stalemate", on Home, on Learn, on the course page and after
  a lesson. The course page names each step's kind beside its details ("Lesson · 8 min · Rules").
- **No focus ring after a click or a tap.** When the page moves the focus by itself (to _Continue_
  in a lesson, into a dialog, back to the board), the ring now shows only for keyboard use, and the
  first key press brings it back. Text fields keep theirs.
- **Phones:** a lesson's buttons share the width two by two, and a last one left on its own takes
  the whole row. The cards over a board (a repertoire, a drill, the arcade games) have buttons the
  width of the card, and the board behind them is faded further.
- A lesson's conversation, scrolled in its box, fades out at the top instead of showing a line cut
  in half.
- _Mark as not done_ on a lesson and _Bookmark_ on a puzzle line up with the text around them.
- The choices of a segmented control wrap inside it wherever one row is too narrow: the test lab's
  piece sets ran off the page on a tablet.
- The first answer to "Where should your puzzle rating start?" reads _Find my level (recommended)_,
  with a _12 puzzles_ pill like the levels below it; a pill on the chosen answer keeps its outline.
- Army Draft's "The engine's army" fits a phone: _Random draft, same budget_.
- The footer's _Keyboard shortcuts_, the disclosures ("Engine diagnostics"…), the test lab's
  section links and the Progress page's theme links are at least 24px high.

### Fixed

- In a lesson, the dot of the step on screen lost its number when that step was done before (accent
  on accent). It now keeps it, ringed as the current step.
- Text that sat right against what was above it: the note under the import button on My games, and
  on Play online the time-control prompt under the colour choice and the notes under the switches.

## [0.27.0] - 2026-10-10

An offline copy with every release: the whole app in one download, started with a double-click, with
no internet connection and nothing to install.

### Added

- **The offline copy.** Every GitHub release has `chess-trainer-<version>-offline.zip` (about 190 MB),
  with its checksum in `SHA256SUMS.txt`. It holds the whole app: every lesson and puzzle, the full
  engine and the human-like opponent. Unzip it and start it with _Start Chess Trainer.exe_ on Windows,
  _Start Chess Trainer.command_ on macOS (Apple silicon and Intel) or `start-chess-trainer.sh` on
  Linux (x64 and Arm64). A small launcher then serves the app on the computer and opens it in the
  browser at `http://localhost:8064/`. Nothing else can reach the launcher, and the app is isolated
  from the first visit, so the multi-threaded engine runs at once. The README inside says what to
  click the first time Windows or macOS asks about an app from the internet.
- **Progress carries over between copies.** The address stays the same, so a newer copy finds the
  same progress and settings, and an old one can be deleted. If another program holds the port, the
  launcher takes the next free one and says so. Starting it a second time opens the copy that is
  already running.
- **Sync and live games work from the copy** whenever the computer is online. The relay now also
  accepts `http://localhost:8064`.
- **The Release workflow** builds the copy from the tag. It unzips the copy and tries it in Chromium
  through its own launcher, and only then publishes the release with the zip attached. A failed
  release can be published again from the Actions tab. CI tries the copy on every change too, after
  the launcher's own Go checks on Linux, Windows and macOS. To build it by hand:
  `npm run release:offline` (Go 1.24 or newer), then `npm run e2e:offline`.

### Changed

- The release notes say what the offline copy is and where to find it.

## [0.26.1] - 2026-10-10

Lessons at your own pace: the coach's words stay up until you have read them.

### Changed

- **You go on when you are ready.** After a right move (or a shown answer), the coach explains it
  and the lesson waits. **Continue** (or →, or Enter) plays the opponent's reply and asks the next
  question. Before, the reply and the next question came 0.6 seconds after the move, while the
  explanation was still being read. On a phone, Continue also sits under the coach's words, below
  the board. Lesson recall works the same way.
- Each answer from the coach starts at the top of the conversation box and stays there until you
  do something else. Under the board on a phone, the coach's newest words replace the last ones
  only when you move or go on.

### Fixed

- On a phone, a wrong move that the opponent punishes no longer makes the page jump down to the
  _Take back_ button, which took the board and the coach's words out of sight. _Take back_,
  _Continue_ and recall's _Next_ now take the keyboard focus without scrolling, and the board gets
  the focus back afterwards.
- A hint now comes into view in the conversation box. Before, the box scrolled back to its top
  (or to your last move) and the hint landed out of sight.
- Scrolling the conversation box to read something again is no longer undone when the punishing
  reply to a wrong move arrives.
- A step already done can be played through again: _Take back_ and _Continue_ show there too.
- After _Continue_ or _Take back_ on a phone, the board scrolls back into view if the page was
  scrolled past it.

## [0.26.0] - 2026-10-10

Play online: a waiting room for live games against people, refereed by the app's own relay, and
on Lichess at the same time if you like.

### Added

- **Play online** (_Play → Play a person online_). Post a game with a tap on a time control (1+0 to
  30+20, or your own) and a colour, or join one from the list. Posting a game someone is already
  waiting for pairs you at once. There is no account: you play under a made-up name, such as
  "Patient Bishop", and can show your puzzle rating beside it.
- **Wait anywhere.** A posted game stays up while you use the rest of the app. A bar under the
  header shows the wait, and when someone joins, a sound plays and the bar takes you to the board.
  After three minutes with nobody, the waiting room suggests the human-like opponent meanwhile. A
  game in progress keeps a bar that leads back to it, even after the app has been closed or
  reloaded.
- **Private games** that only people with the link can join (the share sheet, or a copied link).
- **Live games refereed by the relay.** It takes only legal moves and keeps both clocks. Each first
  move has 45 seconds. You can abort before both sides have moved, resign, offer a draw, ask to take
  back a move, and claim the game when your opponent has been gone for 30 seconds. Mate,
  stalemate, a dead position, repetition and the fifty-move rule end the game by themselves.
  Rematches swap the colours. Players send set phrases instead of typing, and there is no engine
  help. Finished games go to My games, from your side, ready for the review.
- **Also look on Lichess** (when signed in). The same game is posted on Lichess too, rated or
  casual, for rapid and slower time controls. Whoever accepts first plays you, and the other post
  is withdrawn. A Lichess game is played on the board here with Lichess's clocks, and is kept in My
  games with its Lichess address.
- The relay runs live games as two Durable Objects on Cloudflare's free plan, or in memory on the
  Node server, with chess.js as the referee.

### Changed

- New Lichess sign-ins ask for permission to play (`board:play`). An older sign-in gets _Allow live
  games on Lichess_ in the waiting room, which signs in again and comes back there. The account
  sync needs nothing new.
- The page's security policy allows WebSockets to the relay.
- My games marks games played online and keeps the side you played.
- Deploying the relay installs its one dependency first: `npm run relay:deploy` runs
  `npm ci --prefix relay` before Wrangler.

## [0.25.0] - 2026-10-10

Lessons with a coach: every lesson now talks you through the position, says why each move works,
answers the tempting mistakes on the board, and plays its combinations out move by move.

### Added

- **A coach in every lesson.** Each step is a conversation beside the board: the coach sets up the
  position and asks a question; after your move it says what the move does, **why it works** and
  what to take into your own games. All 75 lessons are rewritten in this voice.
- **Answers to wrong moves.** The tempting mistakes have the coach's own answer, and the opponent's
  punishing reply is played on the board, with a red arrow, until you take the move back. Any other
  move that leaves a piece to be taken, allows a mate in one, stalemates or lets a pawn promote is
  explained from the board itself, with the captures followed through to the end.
- **Lines.** Combinations, mating nets, endgame techniques and opening plans are played out over two
  to four moves: the opponent replies, the coach says what the reply changes, and the next question
  follows. "Show answer" plays one move of the line at a time, with its explanation.
- On phones the coach's latest words sit right under the board, with a Take back button. On wide
  screens the conversation scrolls inside the panel beside the board (to your latest move), so the
  board and the question stay in view.
- For lesson authors: `npm run lessons:preview` shows what the coach says to every legal move of a
  lesson (scored by Stockfish with `--engine`), `npm run engine:analyse` prints the engine's lines for
  a position, and the content guide has a section on the coach's voice with word limits for
  everything the coach says.

### Changed

- Lessons load a file at a time: opening a lesson downloads only its own file (10–35 KB gzipped),
  and every list of lessons, the Learn page included, reads the small lesson index instead.
- The lesson checks cover the new content: every move of every line, every refutation (the
  opponent's best answer or close to it, leaving the learner clearly worse off) and the reply the
  board's own answer plays to each of the other moves. The structural tests also hold the coach to
  its word limits and keep the side to move out of the questions (the page shows it).
- Lessons whose follow-up steps became lines have fewer steps. A completed lesson stays completed;
  progress on single steps of a changed lesson, and recall cards for steps that moved, follow the
  step now in that place (a card whose step has no task any more is dropped).
- The lesson's summary gives way to the board on phones.

### Fixed

- Positions and claims the rewrite found wrong: the Greek gift position (White was two pieces up;
  it is now a level French position, with the toughest defence, ...Kg6, as a line of its own), the
  zugzwang example (it was not one), a prophylaxis position where the queen could simply be taken,
  the breakthrough ending (now with a single winning move), wrong claims about the isolated pawn,
  hanging pawns, the extra-pawn conversion, candidate moves and a rook against a minor piece, a
  King's Indian move called a mistake that is as good as the answer, and a bishop-and-rook ending
  step the tablebase contradicted.

## [0.24.0] - 2026-10-07

Sync between devices carries the settings too, so any device is ready to play as you left it, and
each device chooses what it syncs.

### Added

- **Settings sync between devices.** The theme, the board and pieces, the sounds, the notation and
  the puzzle and play options go with the rest of the profile. A setting changed on two devices
  before they synced takes the value of the one that synced first, and a device joining takes the
  synced settings. The engine's threads, the full engine download and the install prompt stay with
  each device.
- **What syncs on this device:** a switch for each part — Progress, Repertoires, Saved analyses,
  Imported games and Settings — all on by default, and offered before sync is turned on or joined
  as well. A part switched off stays as it is on the device while the other devices keep theirs;
  switched on again, what changed on both sides meanwhile comes together, merged against the version
  the two last shared, so nothing is counted twice.
- Backups hold the profile's settings (format 12). Imported with sync off, a backup restores them;
  with sync on, the settings stay as they are. An older backup leaves them as they are.
- The sync status counts settings with the rest: "2 settings from your other devices." Turning
  sync on counts the settings changed from their defaults.

### Changed

- Settings belong to a profile: each keeps its own, and a new profile starts with the settings of
  the one it was made from. The engine settings and the install prompt belong to the device and
  are the same in every profile. A profile made before keeps reading the main profile's settings
  until one of them changes there.
- _Reset everything_ resets the profile's settings with its data, and the device's engine settings.
- The sync card's totals count the parts the device syncs.

### Fixed

- The sync status no longer forgets what a sync moved when a second run followed it straight away
  (something changed while it ran): it says what both moved.

## [0.23.0] - 2026-10-07

Settings in tabs, and sync between devices that counts what it keeps in step and what each sync
moved.

### Added

- **Settings in tabs:** Appearance, Play, Engine, Sync & data and App. The address names the open
  tab (`/settings#engine`), so a reload or a link opens it again, and a link to a card (the profile
  badge's, the way back from the Lichess sign-in, a join link) opens the card's tab and scrolls to
  it. The tabs are one tab stop: the arrow keys, Home and End move between them, and on phones they
  wrap onto two rows.
- **Sync between devices, counted.** The card shows what is kept in step — puzzles played, lessons
  completed, your own repertoires, repertoire moves in review, saved analyses and imported games —
  and, after each sync, what came in from the other devices and what went out: "4 puzzles and 1
  analysis from your other devices; 2 imported games sent." Turning sync on says what it sent;
  joining says what came in, or, when the device made way for the synced data, what it now has; a
  backup imported with sync on says what it added, or that the synced data held all of it already.
- A `Tabs` component in the UI kit (the WAI-ARIA tabs pattern), and palette, chip, sync and device
  icons for the tabs.

### Changed

- The settings are regrouped across the tabs. _Display_ (colour scheme and notation) and _Sound &
  vibration_ (the sounds, their theme and volume, and vibration, which was under Play) sit with the
  _Board_. The human-like opponent has a card of its own beside Play and the puzzle rating. Backups
  have their own card, and the storage meter shares one with _Reset everything_, beside sync, the
  Lichess account and the profiles, under a line that says what leaves the device. Installing the
  app, the icon badge, offline puzzles, the test lab and the version are under App.
- The Progress page's Settings button opens Sync & data, and the test lab's way back opens App.
- The accessibility sweep covers every tab.

### Fixed

- On a phone, the engine diagnostics no longer widen the page when they say why the engine runs on
  one thread: the reason wraps.

## [0.22.0] - 2026-10-07

Sync between devices, made exact: a lost answer, a page closed half-way through a sync, a full disk
or a second tab no longer makes a device count anything twice or take anything for deleted.

### Added

- **Nothing counted twice, nothing lost.** Each device keeps an exact copy of the version it last
  agreed with the relay, and the sealed vault records each device's latest write under a random id
  the device makes for itself, so a device whose write's answer never arrived can tell whether the
  write went through. A page closed at any moment of a sync, or an import in another tab, never
  makes a device count something twice or take something for deleted.
- When the device's storage is full, syncing waits and says so: nothing the device could not save
  is agreed with the other devices. It carries on by itself once there is room, or at _Sync now_.
- A round from the Lichess puzzle history that two devices both brought in counts once. With sync
  between devices on, the Lichess sync first brings the device up to date with the others (waiting
  up to 10 seconds), so it reads the history knowing what they counted.
- The relay refuses an upload past 1.4 MB as it arrives, whatever its `Content-Length` says, and an
  optional rate limit caps the vaults each address can create (see `relay/README.md`). The Node
  server keeps no more of a request than it needs.
- The join dialog asks for a phrase from the learner's own devices: whoever made a phrase can read
  everything synced with it.
- Tests for the sync drop the relay's answers, close the page at three points of a sync, fill the
  storage and open a second tab (`src/lib/sync/integrity.test.ts`, `restart.test.ts`), with
  stand-ins for the Cache API, Web Locks and another device.

### Changed

- **Joining with progress of its own**, _Keep both_ adds up what the two devices did apart, and
  keeps the puzzle rating, with its chart, of the one that rated a puzzle last. A device restored
  from the other's backup is recognised by the history they share, so what they have in common is
  not counted twice.
- While sync between devices is on, importing a backup joins it with this device's data and the
  synced data, so nothing done here since the last sync is lost. An item that differs is kept twice,
  the backup's version as "… (backup)". The device syncs first, so the import needs a connection
  and adds only what goes beyond the synced data, and an import is undone only while sync is off.
- Settings' offer to send older results to Lichess counts what this device has not sent, and says
  other devices may have sent some puzzles already (Lichess rates a puzzle once).
- Backups are export format 11: they keep the rounds from the Lichess puzzle history counted lately,
  and a random id of the profile's history, so a backup of the profile, or a device restored from
  one, is known as such however long ago it was made. Backups from every earlier format import as
  before.
- When the sync service cannot be reached while the device is online, Settings says so and the
  device tries again two minutes later; only a device that is offline shows as offline.
- The relay's Worker turns base64 around in native code (the `nodejs_compat` flag), so a full vault
  takes about 2 ms of CPU, well inside the free plan's 10 ms per request.
- The FAQ covers joining with progress of its own, importing while sync is on, and whose phrase to
  join with.

### Fixed

- Two devices that did the same thing before syncing (each solved a fork puzzle, played the same
  arcade game or drill, worked on the same study, threat or odds-ladder rung) both count: the merge
  saw two equal records and kept one.
- Two devices that changed the game importer's Lichess or Chess.com username, or the learner's name
  in the imported games, before syncing settle on the same one straight away.
- A join link whose phrase was damaged on the way (a broken `%` escape) opens the dialog with the
  words as they are, and the dialog names any it cannot read, instead of breaking the Settings page.
- The join dialog stays open while a join is under way: closing it would not have stopped the join.
- The relay's Node server does not start with a `--port` or `--max-bytes` that is not a whole
  number, instead of running without a size limit.

## [0.21.1] - 2026-10-07

### Fixed

- With sync between devices on two devices and _Puzzle rating from Lichess_ on, both devices take
  the same rating from Lichess. The merge added those two changes up, so the rating went past the
  Lichess one, then back, from sync to sync. Two devices that arrive at the same rating now keep
  it, and both sides' changes still add up when they differ.

## [0.21.0] - 2026-10-07

Sync between devices: a phone, a tablet and a computer keep the same progress, with no account. A
12-word recovery phrase is the key, everything is encrypted on the device before it leaves, and the
small relay that passes it between devices stores only scrambled data.

### Added

- **Sync between devices** (_Settings → Sync between devices_). Turning it on gives a **recovery
  phrase** of 12 BIP-39 words (the first four letters of each are enough) and a QR code of a link
  that carries them. Another device joins by scanning the code, which opens Settings there with the
  phrase filled in, or by typing or pasting the words. Progress, ratings, lessons, flashcards, review
  schedules, repertoires, saved analyses and imported games stay in step. Device settings, the
  Lichess sign-in and the backup reminder stay on each device.
- **End-to-end encrypted.** The data is encrypted on the device with AES-256-GCM, using keys made
  from the phrase by HKDF-SHA-256. The relay keeps one sealed file per phrase under a random name,
  with no account, email or device name, and keeps no logs. A copy that was changed, swapped for
  another or rolled back to an older version is refused.
- **Merged, not overwritten.** Each device merges three ways against the version it last agreed
  with the relay:
  - changes from either side carry over, deletions included;
  - logs join;
  - counts add up both sides' increments;
  - a repertoire or analysis edited on two devices before they synced is kept twice, the other
    version named "… (other device)".

  Two devices syncing at once never overwrite each other. Changes made offline wait, and join the
  rest when the device is back online. A device joining with progress of its own chooses whether it
  joins the synced data or makes way for it.

- _Show recovery phrase_ adds another device. _Turn off_ stops syncing on one device, and _Delete
  synced copy_ removes the encrypted copy; every device keeps its data, and the others say so at
  their next sync. A synced copy no device has used for a year is deleted.
- **The relay** (`relay/`) runs as a Cloudflare Worker with a D1 database, which the free plan
  covers (`npm run relay:deploy`), or as a dependency-free Node server with SQLite for hosting it
  yourself (`npm run relay:dev` runs one locally). `relay/README.md` covers its API, its deployment
  and what it can and cannot see. Setting `syncRelay` to `''` in `src/site.config.ts` leaves sync
  out of a build.
- `npm run readme:screenshots` renders the README's pictures from a running preview build, so a
  release can refresh them in one command. Its learner, dates and random choices are seeded, the
  app's own included, so every picture comes out the same until the app changes. The exception is
  the game review, whose engine analysis varies a little from run to run. It shares its browser
  set-up, seed and encoder with `npm run screenshots` (`scripts/lib/screenshots.mjs`).

### Changed

- While sync between devices is on:
  - importing a backup joins it with the synced data rather than replacing anything, so nothing is
    deleted from the other devices, and the import dialog says so;
  - _Reset everything_ turns sync off on the device before clearing it;
  - the backup reminder rests while the data has a synced copy from the last week;
  - the Lichess account sync leaves repertoires and analyses to device sync, because two devices
    matching the same items to the studies would make copies.
- The Content-Security-Policy lets the page reach the relay, and nothing more.
- Settings, the Progress page and the FAQ describe what syncs and what leaves the device.
- The README shows six screens instead of three, under a new hero image of the puzzle trainer and a
  game on a phone: game review, a lesson, an opening repertoire, the progress page, the arcade, and
  the board themes with the piece sets. The pictures are WebP.

## [0.20.0] - 2026-10-06

The pieces and the boards now come from the open collections Lichess publishes: eight of its best
piece sets join Classic, the sets drawn for 0.19 are gone, and every one of its 25 boards can be
chosen.

### Added

- **Eight piece sets from the Lichess collection**, chosen beside the 0.19 sets on the same boards
  and measured the same way: **Merida**, **Chessnut**, **MPChess** and **Celtic**, which anyone may
  use, and **California**, **Maestro**, **Staunty** and **Cardinal**, which are CC BY-NC-SA 4.0 and so
  for non-commercial use only. The SVGs are copied unchanged. Each set's author and licence show
  under the picker in Settings and in the footer while it is chosen, and Chessnut's Apache licence
  ships with the site (`licence-apache.txt`).
- **Every Lichess board, 25 in all.** Twenty are Lichess's pictures, copied unchanged: Wood (and
  Wood 2, 3 and 4), Maple and Maple 2, Horsey, Leather, Blue 2, Blue 3, Canvas, Blue marble, Marble,
  Green plastic, Olive, Grey, Metal, Newspaper, Purple diagonal and Pink. The other five (Brown,
  Blue, IC, Green and Purple) are flat, drawn from their colours. Ice, Walnut and High contrast
  stay, for 28 board themes. A picture is downloaded the first time its board is shown and drawn on
  every board, the drills' and the board editor's included; until it arrives, or offline before it
  was ever fetched, the board shows the picture's colours. The pictures are under the AGPL-3.0,
  credited with their authors under the board picker and in the third-party notices.

### Changed

- Every set but Classic loads the first time it is shown, so a visitor downloads only the set they
  use: the stylesheet every page waits for drops from 17 KB to 11 KB compressed. The service worker
  still keeps every set for offline use, and its precache budget rises from 6.5 to 6.75 MB to hold
  them. Until a set's stylesheet arrives (or offline, before it was ever fetched) the board shows
  Classic.
- The footer credits the chosen piece set — its name, author and licence — rather than always the
  classic one.
- Green, Grey, Olive and Purple are now Lichess's: Grey and Olive its pictures, Green and Purple its
  colours. A device that had one of them chosen keeps it, in its new look.
- The board pickers in Settings and the Lab show each textured board as a 128-pixel preview (about
  50 KB for all twenty; `npm run boards:thumbs` makes them), so opening Settings never downloads the
  full pictures (1.9 MB). The board setting is called Board theme, and each of its swatches is the
  board's corner, two squares by two, rather than a diagonal split of its colours.
- The service worker keeps the board pictures it has shown in a cache of their own
  (`chess-trainer-boards`) rather than precaching them, so installing the app costs nothing more
  and the chosen board works offline.
- The start-up code budget rises from 42 to 43 KB: the settings check the 28 board themes and nine
  piece sets as the app starts.
- README, FEATURES, ARCHITECTURE, CONTRIBUTING and the third-party notices describe the sets and
  the boards, their licences and what the non-commercial four sets mean for anyone who would sell
  the app.

### Removed

- The Staunton, Bold, Modern, Pixel and Letters sets drawn for 0.19. A device that had one of them
  chosen shows Classic.

### Testing

- Unit tests: the stylesheets match the SVGs; every set has its twelve pieces, with no scripts or
  outside links in them; the list of sets matches the settings, the loaders and the credits; every
  set is credited with its licence, the non-commercial ones flagged; the Apache licence ships with
  the site. Every textured board has its picture and its preview and nothing else is in the
  folder; the pictures are square (so they fit the 64 squares) and the SVG one has nothing to fetch
  or run; a flat board is a checkerboard of its colours with a light corner square; a textured one
  is layered over its colours; the themes match the settings, and choosing one in Settings credits
  its authors and links its licence.
- End to end: a chosen set loads only its own stylesheet, shows on the board, is kept across a
  reload and is credited in the footer with its licence; the picker loads every set; a set removed
  after 0.19 falls back to Classic. The board picker fetches the previews only; a chosen textured
  board draws its picture on the analysis board and the drills' board; a flat board fetches
  nothing; the picture is kept by the service worker, served offline, and not precached.

## [0.19.0] - 2026-10-06

New piece sets, all drawn for this project and judged by how quickly the pieces tell apart: two new
ones, and the three original sets of 0.18 drawn again after a review showed where they fell short.

### Added

- **Staunton** piece set: tournament shapes — a turned foot and ring, a stem, a collar and each
  piece's own head — with a heavier line than the classic set's, so the pieces stay crisp on a
  phone. Black pieces carry light bands that hold on dark squares.
- **Bold** piece set: big, simple shapes with a heavy outline and one oversized feature each: the
  cross, a fanned crown of pearls, a slim mitre with its slit, the horse's head, deep battlements and
  a round, bell-shaped pawn. Black pieces carry a light rim that lifts them off dark squares.

### Changed

- **Modern, Pixel and Letters are drawn again.** Modern is plain geometry without the shared plate
  that made every piece the same width; its king no longer reads as a tombstone and its knight is a
  horse's head. Pixel steps down clearly from king to pawn, with a round pawn head, a fanned queen's
  crown, a slim bishop with a slit and the same one-pixel outline on every piece. Letters draws its six
  letters as paths instead of setting them in the device's Arial, so they look the same everywhere,
  and drops the tiles that turned the board into a grid of boxes; pawns are a size smaller.
- Every original set now steps down in height from king to pawn, keeps one line weight throughout and
  draws its symmetric pieces as one mirrored half. The classic cburnett set stays as it was.
- The piece picker in Settings shows two sets to a row on phones.
- FEATURES, ARCHITECTURE, CONTRIBUTING and the third-party notices describe the six sets and where
  they are drawn (`scripts/pieces/`, one module per set).

### Testing

- Unit tests: every drawing is a well-formed SVG and the twelve pieces of a set all differ; the
  stylesheets in `src/components/board/` match the drawings; the pixel masks stay on their 16×16 grid
  with symmetric outlines; the list of sets matches the settings and the stylesheets the app loads.
- End to end: the picker shows all six sets, each in its own style, and the board uses the chosen one.

## [0.18.0] - 2026-10-06

Every screen checked on phones and desktops, in each colour scheme, and put right where the layout
let it down — and lessons you already know can be marked as done without working through them.

### Added

- **Mark a lesson as done** from its card on Learn, its row in a course or its own page (_Mark as
  done_ beside the title). It then counts as completed — in courses, on Learn and for the next lesson
  — but not as training: no streak day, no recall positions, nothing in the week's figures. _Mark as
  not done_ starts the lesson again from its first step; both come with an Undo. Working through every
  step later completes it for real, recall included. Backups keep the mark.

### Fixed

- **Reduced motion:** with the system's “reduce motion” setting on, the board could place its pieces
  and highlights for the size it had a moment earlier — the h-file sticking out past the edge, the
  last-move squares beside their squares. Transitions are now off altogether under that setting, not
  merely very short.
- **Course page:** a later unit's “Up next after unit N” no longer squeezes into a three-line pill
  beside the title; it sits under the unit's description.
- **Progress page** on phones: wide tables no longer make the whole page wider than the screen
  (which also pushed the bottom bar out of reach); a table that needs more room scrolls inside its
  card, with a shadow at the edge that has more, and the week's figures fit as they are. The rating
  chart keeps legible labels at any width.
- **Start and result cards over the board** (a repertoire, the arcade games' settings, Puzzle Rush,
  the drills) stay within the board, and one taller than the board makes the board area taller
  instead of running over the file letters and the card below.
- **Board pages on wide screens:** the board's column is as wide as the board, so no empty band opens
  between the board and the side panel, and the panel gets the room (its buttons no longer wrap one
  to a line).
- **Learn:** course cards are no longer underlined and coloured like a link from top to bottom, and
  the three courses share a row; the lesson page's keyboard hint is gone on touch screens (it left
  “to move between steps” on its own), and its links never start a line with a dot.
- **Home:** “~31 min left” stays on one line; the plan's lesson says what the lesson is instead of
  repeating its minutes; the nine features sit three by three and the three levels side by side on
  wide screens; a card's last paragraph no longer adds space at its bottom.
- **More** on phones: one clear column (titles such as “Endgame studies” no longer break in two), and
  the page behind is dimmed — a tap on it closes the sheet.
- **Puzzles:** the nine modes in three even rows on phones; counts written with thousands separators
  (“24,128”); the Rush card has no empty half before a run; empty states line up under the modes.
- **Cards in grids:** the difficulty, result and level badges moved to the foot of drill, classic
  game and endgame study cards, so titles get the card's width; repertoire cards line their progress
  and buttons up along a row, show their level above the name, and a custom repertoire no longer
  shows “Custom repertoire” where the moves go.
- **Repertoire page:** the start card no longer repeats the status shown beside the board.
- **My games:** the games and your openings are lists that wrap within their cards (the table cut off
  its last column, the actions); dates are written one way; the time-control choice shows in full;
  the empty list no longer points “to the left”, which is above on a phone.
- **Endgame studies:** the goal and the result sit at the foot of each card instead of stacking
  unevenly beside the title.
- **Breadcrumbs** read the same on every page (the course, study, lesson and recall pages had their
  own).
- **Arcade:** Play buttons stay bottom right on every card; the game panels lose the empty line they
  kept before a game; the Fortress figures line up with the other panels; the Daily Opening's matches
  push the page down on phones instead of covering the end of it; the simul's board tiles have room
  for “Your move”.
- **Dialogs** taller than the screen (a new game's settings on a phone) keep their title and buttons
  in place while the rest scrolls between them; the close button no longer sits over the content.
- **Analyze:** the Game review heading no longer wraps under its controls; the empty move list reads
  in the normal font; the engine's status no longer starts with a dot.
- **Reference:** the rules and notation cards flow in two columns without blank space, and the FAQ
  keeps to a reading width.
- **Settings and test lab:** the volume slider spans its row; the engine diagnostics' badges wrap
  within the card; Yes/No pills never break in two; the lab's keyboard line is gone on touch screens.
- **Touch targets:** the lesson step numbers, disclosure rows (“Reset progress…”, “Engine
  diagnostics”), the lab's section links, Home's Details and the first move of an engine line are
  finger-sized; the footer's “Keyboard shortcuts” is hidden where there is no keyboard.
- Badges never wrap; a button whose label wraps gets room above and below it; stat rows fit three
  across on phones and stay together in wide cards; the Progress ladder line no longer says the
  level twice; the ratings table uses the page's font.

### Changed

- The README's screenshots and the install dialog's (the web app manifest's) were taken again from
  this version; the README's showed the app as it looked before blind puzzles came in.

### Security

- `source-map-js`, which the build and test tools use, is on 1.2.2 for a newly published advisory
  (GHSA-68fv-2mgg-jv7q); `npm audit` is clean again. Nothing of it reaches the app.

### Testing

- A screen-by-screen visual check: every page and the states reached by playing (a game on, a puzzle
  over, a run going, dialogs and toasts) captured at phone, small phone, tablet, laptop and wide
  sizes in the light, dark and black schemes, with automatic checks for sideways scrolling,
  overlapping controls, wrapped pills and buttons, clipped text and small touch targets.
- End to end in every browser: marking lessons done from Learn, a course and the lesson page, with
  Undo, a reload and no training day; with reduced motion the board puts every piece on its square.
- Unit tests: marking done and not done, the undo, a marked lesson completed for real by its steps,
  restarting it; the week's figures and the daily plan leave marked lessons out; backups keep the
  mark; the Learn, course and lesson pages' controls; PGN dates written like the others.

## [0.17.1] - 2026-10-05

The Lichess account sync stays connected: 0.17.0 could ask to connect again seconds after every
sign-in.

### Fixed

- **Lichess account:** connecting no longer ends, seconds later, in “Lichess no longer accepts this
  device’s sign-in”. The private studies 0.17.0 made for repertoires and analyses had their sharing
  set to nobody, and Lichess refuses to export such a study to anyone, its owner included; the app
  took that refusal for a lost sign-in. Studies are now made with sharing and export left to their
  owner (still private, chat and cloning off). The studies 0.17.0 made — Lichess’s API cannot change
  their settings — are read through the export of all the account’s studies instead, and the empty
  first chapter a stopped sync left in one is removed.
- Only a sign-in Lichess no longer knows, or one short of a permission the sync needs, asks to
  connect again. Anything else Lichess refuses is noted in the card, and the rest of the sync goes
  on.
- A sign-in marked as refused is checked with Lichess again when the app opens: an account 0.17.0
  signed out by mistake carries on syncing by itself, with nothing lost.

### Changed

- The README’s statements were checked against the app: all 48,000 puzzles offline takes
  _Download every puzzle_ in Settings; a fork has to enable its workflows before the site deploys;
  what CI runs is listed in full.

### Testing

- The stand-in Lichess keeps to lila’s study settings: creating a study takes all five “who may”
  settings, a study’s own export refuses a viewer its sharing setting does not allow — “nobody”
  refuses its owner too — while the export of all an account’s studies does not ask, and listing
  studies needs the study permission.
- Unit tests: a 403 that names a missing permission against one that refuses the request itself;
  studies made for their owner to export; a study made by 0.17.0 read through the account’s export
  (the account’s other studies left alone) and tidied, then kept in step both ways; such a study
  missing from that export left for the next sync, deciding nothing; a sign-in short of a permission
  asking to connect again, another refusal noted with the rest of the run going on; the sign-in
  checked again as the app opens, the mark lifted only for a token Lichess still knows with every
  permission.
- End to end in every browser: an account 0.17.0 signed out by mistake carries on by itself as the
  app opens, its study read all the same.

## [0.17.0] - 2026-10-05

Your Lichess account as the meeting point of your devices. Connect it once and the app keeps in step
with it, both ways: puzzles solved here count on Lichess — offline ones go up when you are back
online — your Lichess puzzle history comes here with its misses ready to review, games you play are
imported to Lichess and come back on your other devices, and your own repertoires and saved analyses
live in private Lichess studies. There is still no server of the app's own: the browser talks to
lichess.org directly.

### Added

- **Settings → Lichess account.** _Connect Lichess account_ signs you in on lichess.org (the OAuth
  flow with PKCE, so the app needs no server and no registration), which asks whether the app may
  read and write your puzzle activity and your studies, then brings you back to Settings and runs the
  first sync. The card shows the account and its puzzle rating, what the last sync did, what waits to
  go up, _Sync now_, a switch for each part, and _Disconnect_, which withdraws the permission on
  Lichess. If Lichess stops accepting the sign-in, the card says so and offers to connect again.
  _Connect with a personal token instead_ takes a token made on lichess.org (the card links to the
  page with the permissions ticked) and checks it — the way in for an app on the Home Screen of an
  iPhone or iPad, which iOS sends to Safari for the sign-in.
  Puzzle results and games the device recorded without sending — before connecting, while
  disconnected or while that part was off — are offered after connecting and when a part is switched
  back on.
- **Puzzles both ways.** Every Lichess puzzle solved here goes to Lichess — rated when it was rated
  here, a win only without a hint; blind and rush solves unrated — through an outbox that keeps
  results played offline until the device is back online (the Puzzles page says how many wait). The
  Lichess puzzle history comes down: puzzles new to this device count in the theme statistics and the
  training days, and the newest misses (up to 30 a sync) are fetched whole and join the review queue,
  where they work offline. The puzzle rating follows your Lichess puzzle rating (a switch of its own).
  Results sent from here are recognised when they come back and never count twice.
- **Games both ways.** A game finished here — against the engine, the human-like opponent, in the
  arcade or the simul; drill positions stay on the device — is imported to your Lichess account,
  where its analysis board can look at it, and the game log links to it. The app's record of the game
  travels in the PGN, so your other devices bring it back into their game logs. Lichess imports the
  same text only once, so a retried upload never doubles a game.
- **Repertoires and analyses in private studies.** Custom repertoires become the chapters of _Chess
  Trainer · Repertoires_, saved analyses of one study per collection (_Chess Trainer · Analyses:
  Endgames_), continued in "(2)" past Lichess's 64 chapters. New moves, comments, glyphs and arrows,
  a new name or side, and deletions come across either way; when the same item changed on both sides
  since the last sync, both versions are kept, the Lichess one as "… (Lichess)". Only a deletion made
  in the app deletes on Lichess — an item that went missing any other way (a damaged save) comes back
  from its chapter — and a whole study deleted on Lichess is made again from the device rather than
  taken as a deletion. An item too big for a chapter (3,000 moves) or refused by Lichess stays on the
  device, and the card names it.
- **The sync runs on its own** a few seconds after the app opens, when the device comes back online or
  the app back into view, half a minute after results start to wait, and every quarter of an hour on
  screen: one request at a time, as Lichess asks, pausing when Lichess asks for a pause, never two
  runs at once (across tabs too), and nothing lost when it stops part-way.
- **The human-like opponent's rating from Lichess.** With an account connected, the game setup
  suggests the Maia rating nearest your Lichess rapid rating (else blitz, else classical).
- The FAQ says what connecting does and what leaves the device.

### Changed

- Backups are export format 10: they keep the Lichess puzzles waiting in the review queue and which
  games went to Lichess. Backups from every earlier format import as before. The Lichess connection
  is never part of a backup; importing one starts the matching over, so nothing on Lichess is deleted
  for items the backup does not hold.
- _Reset everything_ also disconnects the profile's Lichess account and withdraws its permission.
- Connecting fills in the Lichess name the game importer uses, when none was set.
- The privacy wording in Settings, the FAQ and the docs covers the sync: no sign-up and no server of
  the app's own, and the Lichess sync talks to lichess.org alone. With an account connected, Progress
  and the backup reminder say what is kept in step and what only a backup moves.

### Testing

- A stand-in lichess.org (`src/test/fakeLichess.ts`) that answers as lila does — the OAuth code flow
  with PKCE and its approval page, puzzle batches and history, game imports and their export, studies
  with their 64-chapter limit, the empty first chapter, the import that stops at the first chapter it
  cannot take, and the 400 for a chapter that is gone — shared by the unit and end-to-end tests.
- Unit tests for the requests (one at a time, the kinds of failure, streams that stop early), the
  sign-in (the RFC 7636 example, a refused or stale or foreign answer, a wrong verifier, revoking), a
  personal token (accepted; malformed, unknown or short of permissions turned down), the connection
  store (repair, caps, a different account starting afresh, the backlog), the puzzle
  conversion — seven real Lichess answers come out exactly as the app's own puzzle files have them —
  the game records, the studies model (names sent as Lichess keeps them — a port of its clean-up of
  study and chapter names — hashes that settle after one rewrite and survive Lichess's way of writing
  a PGN, every reconcile case) and the study sync against the stand-in (first upload, a second
  device's restore, edits and deletions both ways, an item lost to a damaged save restored, both sides
  changed, a deleted study, an unreadable chapter, too big, refused, a full study, a full library,
  after a backup import, a dropped connection), the sync runs (offline, signed out, a pause, a refused
  batch, the parts switched off, a disconnection mid-run, one run at a time, the timers), the Settings
  card and its token form, the callback page and the 0.17 backup fixture.
- End to end in every browser: connecting through the approval page and disconnecting, connecting
  with a personal token, a cancelled connection, a puzzle solved offline going up once back online,
  and another device's repertoire, analysis, game and missed puzzle coming in.

## [0.16.0] - 2026-10-05

An opponent that plays like a person. The engine levels are Stockfish held back by shallow searches
and random moves: beatable, but nothing like a 1500 player who misjudges a position. The new
human-like opponent is a neural network trained on millions of real games, and it plays the moves
people of the chosen rating play.

### Added

- **A human-like opponent** (_Play → New game → Opponent_), at any rating from 600 to 2600 in steps
  of 100. [Maia-3](https://huggingface.co/UofTCSSLab/Maia3-5M), from the University of Toronto's
  Computational Social Science Lab, predicts how players of that rating move in each position, and
  the opponent plays a move drawn from that prediction — never one the model expects fewer than 2%
  of such players to choose. It goes wrong the way people of its rating do rather than at random, and
  no two games are the same. It takes a moment over its moves: longer when the position is less clear
  to it, less in the opening and when its clock runs low.
- It is a one-time download of about 25 MB — the model and the runtime that plays it — offered in the
  game setup and in _Settings → Play_, with progress and a Stop button. The files are checked against
  their SHA-256 before they are kept, stay on the device for offline play, and Delete in Settings
  removes them. The model runs in a worker on your device: no position leaves it. If it cannot run —
  or cannot choose a move — the game says why and offers Retry, and it starts again by itself if it
  is stopped mid-game.
- Hints, the coach, the blunder check, opening practice, the clocks, blindfold play and the review
  work as they do against the engine. The game setup remembers the opponent and the rating for next
  time (a link that asks for an engine level still opens on the engine), and two wins or two losses
  in a row at one rating suggest a step of 100 up or down.
- Games against the human-like opponent are recorded by rating: in the game log ("Human-like ·
  1500") and in Progress's results, next to the engine levels. The engine ladder and the level
  suggestions count engine games only.
- The footer credits Maia-3, and its licence, the GNU Affero General Public License v3, ships with the
  site as `licence-agpl.txt`.

### Changed

- Backups are export format 9: a game record can come from the human-like opponent, with the rating
  it played at. Backups from every earlier format import as before; a 0.16 backup opened in an older
  version imports with a warning, without the games against the human-like opponent.
- Wording that took the engine for the only opponent now covers both: the coach and blunder-check
  settings, the Home page, "Practise in a game" on a repertoire (it opens the game setup), and the
  weekly summary's "Games vs the computer".
- `npm run build` also installs the human-like opponent's files with `npm run maia:setup` — the
  model from a pinned revision, the runtime from `onnxruntime-web`, both checksum-verified — and
  `npm run dev` tries to, with only a warning when it cannot. CI caches the model's download like
  the engine's.

### Testing

- Unit tests for the model's input and output: the board seen from the side to move (mirrored for
  Black), the 4,352-move vocabulary with promotions for both colours, legal moves only in the
  prediction, the draw from it and the pause before a move; for the worker client (one worker, a
  failed load retried, a crashed or stopped worker failing what was waiting); for the download (the
  runtime then the model, progress, a file that is not the pinned one refused and nothing of it kept,
  an earlier version's files dropped, Stop, Delete); and for the game hook and page (the move drawn
  from the prediction after its pause, waiting for the model to load, a failed load or move and
  Retry, a model stopped mid-game started again, the record and the rating suggestion, the setup
  with its rating and download, Start only once the files are there, the choice remembered), the
  settings, the insights by rating, the setup script's pins and clean-up, and the shipped licence.
- The real model runs in the unit suite — in Node, through the app's own modules, whenever
  `npm run maia:setup` has installed it (CI's quality job does): 1.e4 and 1.d4 first, more 1...e5
  against 1.e4 at 800 and more Sicilians at 2200, a hanging queen taken, promotions for both colours,
  whole games of legal moves at 600, 1500 and 2600, and the very scores Chromium, Firefox and WebKit
  computed.
- End to end in every browser: the download from the game setup, a game with the model's real
  replies, its record on Progress, a game played offline from the stored copy after a reload (online
  in WebKit, which cannot start a worker offline under Playwright), Delete in Settings, and a game in
  a cross-origin-isolated page (the threaded engine's).

## [0.15.0] - 2026-10-05

Three habits that separate improving players from the rest, each with its own trainer: seeing a line
without moving the pieces, asking what the opponent threatens before every move, and finding a game's
turning points before the engine points them out.

### Added

- **Blind puzzles** (_Puzzles → Blind_): the board stays on the starting position while the line is
  played out in notation only — two, three or four-plus moves deep. Moves go in by clicking their two
  squares on the unchanging board or by typing them; the opponent's replies appear in the line (and
  are read out in words). Each length keeps its own level, starting a few hundred points under the
  puzzle rating: +40 for a clean solve, −60 for a miss, nothing gained after a **peek** at the current
  position. A move that is not legal in the current position is turned down without counting as a
  miss, any mate solves, and at the end the board shows where the line ends.
- **What's the threat?** (_Drills_): with the opponent to move, as if you had passed, play the move
  they threaten (two tries, then it is shown), then a move that meets it. 1,200 positions from the
  puzzle set, each engine-checked: in the real game the side to move ignored the threat and lost to
  it. The answer says what the threat does, lists the defences and the game's move; a threat or a
  defence the position does not list is put to the engine, which accepts one as strong.
- **Threats from your own games**: the game review now also asks, for every mistake and blunder,
  what the opponent threatened before it. When the punishment was already threatened, the position
  can join the threat drill — from the key moments on the analysis board, or after reviewing your
  games in My games — and comes back every third position until you have named it twice in a row.
  Only your own moves count when the game says which side you played (games against the engine, or
  the name you import your games under); otherwise both sides' do, and the drill names the side.
- **Blunder check** in games against the engine (off by default; the game setup and _Settings →
  Play_): a move that allows mate at once, or loses two pawns' worth or more to a sequence of captures,
  is held back with _checks, captures, threats?_ — Look again, Show me (the move and the answer that
  punishes it, drawn and named) or Play it anyway. It stays quiet when every move loses as much, needs
  no engine (it answers in a few milliseconds, clocks or not, on a small move generator of its own
  that follows chess.js move for move) and the game summary counts the moves it held back.
- **Analyze it yourself first**: on the analysis board (and from the end of a game, and next to each
  unreviewed game in My games), go through a game with the engine, the explorer, the tablebase and the
  position report out of sight, mark the moves where it turned (M) and play what you would have played
  instead. _Check with the engine_ runs the review and scores your marks: the turning points found —
  on the move or one move late — and missed, false alarms, and each of your moves against the
  engine's (the game move itself, when the engine would have played that too).
- A **Thinking skills** card on Progress (threats named and met, blind levels, turning points caught
  and the trend of your last self-analyses, moves the blunder check held back); the three skills are
  checkpoints in the courses, the threat drill and blind puzzles are on the Drills page and in the
  daily plan's drill rotation, and the visualisation, calculation, candidate-moves, prophylaxis and
  own-games lessons end with a link to the matching practice.

### Changed

- Backups are export format 8: they carry the new records (blind levels, the threat drill and your
  own threats, self-analyses, blunder-check counts). Backups from every earlier format import as
  before, with the new records empty.
- The game review searches once more for each mistake and blunder (the threat after a pass), which
  makes a review a little longer.
- The move list shows the moves marked in self-analysis with a flag; the click board (vision drills,
  board editor, blind puzzles) can tint the last move.
- On phones, a game's pause alerts — the blunder check, the coach and the repertoire — appear right
  under the board, where the move was made, rather than below the game's controls.

### Fixed

- Typing `--` into a move field passed the turn: chess.js reads it as a null move, which no board or
  engine here can play (the engine was sent `a8a8`). It is now turned down like any illegal move.
- The test lab's storage filler gave back two chunks after measuring the limit; depending on what
  else was stored, that could be enough room for the next save to fit, and the "storage is full"
  warning it is there to show never came. It now fills the slack again after the measurement.

### Testing

- Unit tests for the blind-puzzle model and trainer (levels, lines and numbering, legality versus a
  wrong move, any mate, peeks, promotions, the mode on the puzzles page), the blunder check (hanging
  pieces, bad captures, ignored threats, mate in one, forks and lost positions left alone, the
  two-pawn threshold) and its use in the play hook and page (promotions checked once the piece is
  known, counting, play anyway, take-backs), the threat model and drill (passing, descriptions,
  engine checks of other threats and defences, own threats first when due), the review's pass search
  and the threats taken from it, self-analysis scoring and the panel, the new progress records, the
  v8 backup fixture, courses, the daily plan, the lesson links and the Thinking skills card.
- Every bundled threat position is replayed in the unit suite: the threat after a pass, its line,
  each defence and the game move must be legal. The generator's acceptance rules are unit tested.
- The blunder check's move generator counts moves from the six standard perft positions exactly, and
  lists the same moves as chess.js, in the same order, through random games and two moves deep from
  the threat-drill positions. Before it replaced chess.js in the check, both versions judged every
  legal move in 4,221 positions (threat-drill positions, puzzles, random games): 130,032 moves, the
  same answer each time, with the slowest check down from over a second to a few milliseconds.
- End to end in every browser: a blind puzzle solved by clicks and by typing, the threat drill
  through both stages, the blunder check in a game, and self-analysis through to its score.
- Three older end-to-end tests could fail by timing alone, and now wait for what they mean: the
  simul's flag fall waits for the engine's reply on board 1 (its "Your move" was also how the board
  started), the arcade hub clicks again when a click lands beside a link still scrolling into view
  (Firefox), and the position report hovers again when the engine's lines move the card from under
  the mouse.

## [0.14.0] - 2026-10-04

The engine now searches on several cores by default, and Stockfish's full network is one switch
away: a 99 MB download, kept offline, for analysis that sees further in sharp positions.

### Added

- **Full engine** (_Settings → Engine & analysis_): Stockfish 19 with its large network instead of
  the lite one. Switching it on downloads the build this device runs, threaded or not, with a
  progress bar and a Stop button (a stopped download leaves nothing behind); the download carries on
  while you use the rest of the app, and is kept offline. Until it is complete, or wherever it cannot
  start (a phone short of memory, say), the lite engine runs. Switching it off deletes it and says
  how much was freed.
- The engine diagnostics show the full engine's state, and the speed test says when a lighter build
  stood in and why: the full engine not downloaded yet, or a build that failed to start.

### Changed

- **The multi-threaded engine is on by default**, for everyone, saved settings included, and no
  longer marked experimental. The service worker serves every page with the cross-origin-isolation
  headers from the second load on, and the engine then searches on all cores but one (at most eight,
  four on phones and tablets). Where threads cannot run, the one-thread engine takes over as before;
  switching them off still removes the headers from the next load.
- Engine names say which network runs: "Stockfish 19 lite · 3 threads", or "Stockfish 19 · 3
  threads" for the full engine.
- On a first visit the threads setting says "reload" from the start, with its button, rather than
  changing its wording, and shifting the page, when the service worker takes over.
- _Reset everything_ puts threads back on, as the default, and deletes a downloaded full engine.
- Engine files kept offline no longer expire after 180 days (a 99 MB download must not quietly need
  doing again); a new release deletes the engine files it no longer uses instead.
- `npm run dev` installs only the lite builds (4 MB); `npm run build` installs all four (about
  200 MB, once), and `npm run engine:setup -- --lite` just the lite ones, as CI's content checks do.

### Testing

- Build choice, fallbacks (full to lite, threads to one thread, a missing download skipped without a
  warning, four times the start-up time for the full engine), the download's progress, storage check
  and removal, the isolation flag's new default, reset and sync, and the settings migration are unit
  tested; so are both settings switches, in every state they can explain.
- End to end, in every browser: threads on by default and running from the second load, switching
  them off and on, and the full engine downloaded, run from the device's copy with three threads and
  deleted with its switch. API calls under isolation are checked everywhere but WebKit, where
  Playwright cannot mock a request from an isolated page. On desktop Chromium, with the network
  slowed, a download stopped half-way leaves nothing behind.
- The whole suite was also run with every page on two engine threads, to make sure no test depends
  on the engine's choices being the same from run to run.
- The test lab's storage check waits for the lab to finish clearing up, which can come a moment
  after the next page is drawn.
- A test keeps the engine files the app expects equal to the ones the setup script installs.

## [0.13.0] - 2026-10-04

Two new Arcade games built on the rules themselves: Arbiter, where you catch the illegal move in a
replayed classic, and Ghost Knight, where you hunt a knight you only see every third move.

### Added

- **Arbiter** (_Arcade_): a stretch of a classic game replays at speed and then one move breaks the
  rules — call it with the button or Space before the next move would have come. Eighteen kinds of
  illegal move in three tiers, from a knight off its L and a pawn going backwards, through a piece
  jumping another and a pawn left unpromoted, to a pinned piece moving, a king walking into check, a
  check ignored, castling past an attack, en passant too late and one side moving twice. Every call
  is answered with the rule and arrows or marks that show it. Each round is faster; a missed move or
  a legal one called is a strike, and three end the run. A normal and a slow pace; the replay pauses
  when the page is hidden, and a pause covers the board.
- **Ghost Knight** (_Arcade_): an enemy knight hides on the board and shows itself every third move.
  Your squad moves by the ordinary rules; the knight never jumps onto an attacked square and takes
  any piece left unprotected in its reach. Land on it (a rook or bishop that runs into it stops and
  takes it) or corner it. The shaded mode marks every square it could be on; unshaded, you track it
  yourself for double points. Five hunts, each harder than the last, and three lives.
- Two icons for them, a whistle and a ghost, in the same line style as the rest.

### Fixed

- In the dark and black schemes a red button under the pointer (Resign, Delete, Arbiter's call) had
  white text on light red, below the AA contrast ratio; it now has dark text.

### Changed

- The board's spoken square and position descriptions read the pieces from the position itself, so
  boards chess.js cannot load — no kings, or the position after an illegal move — are described too.
- Buttons take a `ref`, so a page can move the keyboard focus to one.
- The Arcade, the Home page and the More menu count eleven games.

### Testing

- Every illegal move found at every position of every classic game, of every kind, is checked to be
  one chess.js refuses; each kind is also tested on a position built for it. Rounds are tested for
  their real moves, their tier and the rare kinds; the run for its clock, calls, strikes, pauses and
  record.
- Ghost Knight's squares-it-could-be-on are checked to hold the real knight through random hunts with
  every squad, and every squad is won within its budget often enough by a hunter that looks one move
  ahead. Catching, running into the knight, cornering it, losing a piece, running out of moves and
  the scoring are tested one by one.
- Both pages are tested end to end in every browser, and in the accessibility sweep in every colour
  scheme.
- The test lab's end-to-end check looks for its own toast rather than the newest one, so the "Ready
  to work offline" toast arriving at the same moment no longer fails the nightly run in Firefox.

## [0.12.1] - 2026-10-04

Sharper game review at every depth, a linked puzzle that says what it is, and React Router 8,
TypeScript 6 and vite-plugin-pwa 2.

### Fixed

- **Game review:** a move the first pass flags is now compared with the engine’s choice once more,
  both moves in one search at depth 14 or deeper, and judged by that search. A deep sacrifice is no
  longer marked down for what a shallow search cannot see — Morphy’s 15.Bxd7+ in the Opera Game was
  a “mistake” at the Fast depth — and a slip the second search finds worse is reported as worse.
- **Puzzles:** a puzzle opened from a link (the recent puzzles on Progress) is unrated practice, and
  the mode bar no longer shows Rated as chosen while it is on the board; the tab reads “Puzzle
  practice”.

### Changed

- **Dependencies:** React Router 8, TypeScript 6 (the deprecated `baseUrl` is gone from the
  TypeScript configs) and vite-plugin-pwa 2. React Router 8 needs Node 22.22 or newer, which is now
  the floor for working on the project.
- The visual snapshot job runs on Ubuntu 24.04, whose fonts the pixel baselines were rendered with,
  so the move of `ubuntu-latest` to Ubuntu 26 on 19 October does not break it.
- Dependabot leaves TypeScript 7 alone until typescript-eslint accepts it (its peer range stops at
  6.x, so TypeScript 7 cannot be installed beside it).
- The screenshots in the README show the current app.

### Testing

- The game review’s second look is tested both ways (a strong move cleared, a slip made worse) and
  at the review’s own depth when that is deeper than 14; a segmented control can show no option as
  chosen; a linked puzzle leaves the mode bar unchosen until a mode is picked.
- The board-style end-to-end check waits for the board’s styles instead of reading them once, so a
  board re-created when the engine becomes ready no longer fails it on slower machines.

## [0.12.0] - 2026-10-03

A full audit of every mode, and what it put right: safer backups, chess and PGN fixes, a sounder
coach and opening practice, analysis and review fixes, corrected lessons, puzzles that work offline
band by band, arcade fixes, accessibility, PWA and platform hardening, licence files, a Content
Security Policy, CI-gated deploys, reproducible builds and a start-up bundle 30 % smaller.

### Added

- **Data and backups**
  - **Backups include My games** (export format 7): the imported games and their reviews now move
    with you. With several profiles on a device, the file name carries the profile’s name.
  - **Importing a backup asks first, and can be undone.** Settings shows what the file holds, offers
    “Export current progress first” and, after the import, “Undo import”. A backup opened with the
    installed app gets the same question instead of being imported at once.
  - **Reset app data** on the crash page, behind a confirmation: when a damaged save keeps the app
    from starting, everything it stored in this browser can be cleared and the app starts afresh.
- **Single-key shortcuts** (_Settings → Play_): letter keys such as H for a hint can be turned off
  for speech input and switch devices (WCAG 2.1.4); Enter, Space and the arrow keys keep working.
- **Analyze:** move buttons right under the board on phones; an en passant square in the board
  editor; “Load the moves before it” when a PGN has an illegal move.
- **Learn:** a recall card on Learn and a recall link at the end of each lesson; “Back to course”
  and “Next in course”; glossary entries for Glicko-2, RD, DTZ, DTM, tablebase and Woodpecker, and
  glossary links to the exact lesson step.
- **Board and drills:** castling by dropping the king on its own rook; typed answers in the
  coordinates drill.
- **Arcade:** Analyze game and Copy PGN in every arcade engine game, opening from your side; focus
  mode in all of them; a board strip with Next under the Simul’s board on phones; the Daily Opening
  result through the share sheet where there is one.
- **App:** a monochrome manifest icon for themed launcher icons (Android 13+) and four screenshots
  for the richer install dialog, kept out of the precache (`npm run screenshots` renders them);
  reopening the installed app reuses its window.
- **Licensing:** the footer credits Stockfish (GPL-3.0), Chessground (GPL-3.0), the Classic pieces
  by Colin M.L. Burnett (CC BY-SA 3.0) and the Lichess puzzles and openings (CC0), and links to the
  licence and the third-party notices, now shipped as `licence.txt` and `notices.txt`.
- **Engineering, CI and docs**
  - **Content workflow:** the engine checks every lesson task and scripted reply, every study
    (unlisted moves included), every repertoire move and every drill position, in parallel jobs,
    when the content or its checks change, weekly and on demand; drill checks moved there from every
    CI run.
  - **`npm run repertoires:verify`:** all 2,624 moves of the 16 repertoires pass at depth 14 (within
    120 cp for the learner’s moves, 300 cp for the opponent’s).
  - A **production base path** job tests a `/chess-trainer/` build behind `scripts/serve-dist.mjs`
    (`npm run preview:pages`); **hidden source maps** stay off the site and are kept with each
    deploy for 90 days, and crash reports name the commit.

### Changed

- **Data and backups**
  - **Compatibility.** Backups of every earlier format still import, and saved data migrates by
    itself: settings to version 4, progress to version 7, and the repertoire, games and analysis
    stores now migrate instead of resetting.
  - The backup date, the welcome tour and the Lichess and chess.com usernames belong to each profile
    rather than the device; the unused puzzle-theme setting is gone.
  - The backup reminder waits until there is something worth keeping (lessons, repertoire cards,
    games or a run of rated puzzles), counts attempts, not “solved” puzzles, and “Later” snoozes it
    for a week.
  - Reviews due a day or more away come due at 04:00 local time on that day.
  - An imported analysis library replaces the current one within its 500-entry cap; seen puzzles
    keep the newest 20,000 and the review queue 500; the 200-game cap drops unreviewed games first
    and says how many went; the storage meter says “about”, or uses the limit the test lab measured.
- **Play and repertoires:** at most four engine threads on phones; grading a repertoire move also
  grades its transpositions; sharing a repertoire uses the share sheet where there is one.
- **Analyze and My games:** re-saving a library entry updates it, and the library warns near its
  500-entry cap; game review searches forced moves and the first opening plies less deeply; Insights
  show their sample sizes and grey out thin figures; games and repertoires are parsed once.
- **Learn and Home:** lesson steps are at most 130 words; the space and pawn breaks lesson joined
  the Club player course; locked course units keep full-contrast text; returning learners see
  “Today” first; the Arcade card lists all nine games.
- **Puzzles and drills**
  - **Puzzles load only what they need:** the chunks in memory first, then a few more per band,
    usually stopping after the first. The daily puzzle loads one chunk, and a puzzle opened from
    Progress searches only bands near its rating.
  - Puzzles from your own games accept any move the engine rates within 50 cp of the stored one.
  - Shared Woodpecker sets are checked against the bundled puzzles, even on a slow connection, and
    offered in a dialog; a link with under ten known puzzles is refused, and a missing puzzle is
    skipped, not counted as solved.
  - “Due” and “Redo missed puzzles” replace “Review”; each mode has its own tab title; an unknown
    mode opens the Puzzles page; the vision drills’ “Recall” is “Guess”; drills, studies and
    patterns show difficulty one way.
- **Arcade**
  - **Fairer scores:** Hand & Brain is accuracy × engine level × the share of a full game, with no
    score for resigning before 10 calls; Fortress is positions held × level; Blindfold is (result +
    peek bonus) × level, the bonus only for a win or a draw.
  - Who Stands Better? positions come with either side to move (all had White to move); the side to
    move is shown, and answers are scored in tenths of a pawn.
  - Daily Opening, Engine Says, Who Stands Better? and Hand & Brain follow the notation setting.
- **Settings, lab and sound**
  - The strength setting reads “Engine level for the next game”; in tap mode the magnifier and drag
    target are disabled with a hint; the sound-theme picker stays where the device can vibrate;
    vibration is “available in this browser”; Escape cancels a profile rename, and duplicate names
    are refused.
  - The test lab shows preferences such as reduced motion as information rather than failures,
    re-runs its checks when things change or on Refresh, and records the measured storage limit.
  - Sound mixes with other audio rather than interrupting it, and sleeps after a minute of silence.
- **Wording and consistency**
  - **One confirmation dialog**, Cancel first, for everything that cannot be undone, from resigning
    and giving up to deleting repertoire lines, library entries, puzzles or imported games and
    resetting the board or the rating; the browser’s confirm boxes are gone.
  - One name for each action (“Analyze position”, “Analyze game”, “Play it out”, “Copy link”,
    “Engine level”, “Show the board”, “Play again” beside “New game”); Elo figures are a rough guide
    everywhere; levels, colours and outcomes are shown as words.
  - British spelling: “Defence” and “Centre” in opening names, curly apostrophes, dates such as
    “3 Oct 2026”, the page language en-GB and “Practise” as the verb.
  - One tagline, from the site configuration; the More menu’s groups are Train, Games and Tools on
    every screen; the placement quiz highlights Learn; every not-found page looks the same.
- **App, PWA and platform**
  - **A smaller start.** The launch-file import, the lab clean-up, the audio warm-up and the
    repertoire due count load only when needed: start-up code is 36 KB gzipped (51.5 KB in 0.11.0),
    and its budget drops from 56 KB to 42 KB.
  - The service worker answers only the app’s own routes, so a root deploy on `user.github.io`
    leaves sibling sites alone, and it keeps the threaded-engine flag in memory.
  - The light theme colour and the manifest background match the page; supported browsers are Chrome
    and Edge 111+, Firefox 121+ and Safari 16.4+; `react-router` replaces `react-router-dom`.
- **Engineering, CI and docs**
  - **Deploys wait for CI:** the Pages deploy runs only after CI passes on `main`, and ships the
    commit CI tested.
  - **Reproducible builds:** the build date comes from `SOURCE_DATE_EPOCH` or the last commit, so a
    rebuild is byte-identical and prompts no update; builds record their commit.
  - CI skips the builds for documentation-only pull requests and caches the browsers and the
    engine; a local `npm run e2e` needs only Chromium.
  - Releases check `package.json` against the tag; the openings import reads a pinned commit; drill
    verification loads the drills through Vite; minor dependency updates leave `npm audit` clean.
  - DEPLOYMENT.md is rewritten, CONTRIBUTING.md says what CI runs, ARCHITECTURE.md has measured
    sizes and SECURITY.md matches FEATURES.md; the changelog’s 0.8.0 section is restored and its
    0.11.0 simul note corrected.

### Fixed

- **Data and backups**
  - **A damaged backup can no longer break the app.** Every field is checked first, a bad part is
    refused by name, damaged entries are dropped and all parts are replaced together or not at all;
    a PGN is told it is not a backup.
  - “Reset everything” also clears imported games and the threaded-engine flag, and lists what it
    keeps; the rating reset is a confirmed button that keeps the history.
  - Two tabs no longer overwrite each other; after a full disk every store saves again, with one
    warning; profiles survive a full disk and refuse duplicate names; an unreadable save is copied
    aside; newer data keeps its unknown fields; a broken rating or unknown setting is repaired; the
    best streak can pass 400 days; Android’s text-typed `.json` files can be picked.
- **Chess and PGN**
  - PGN with glued move numbers (`1.e4 e5`) imports; `[%clk]`, `[%eval]`, `[%csl]` and `[%cal]` are
    no longer shown as comments and survive export; a bad FEN header no longer crashes Analyze.
  - Castling rights and en passant squares are checked against the pieces, so no phantom castling;
    four-field FENs and EPDs are accepted; evaluation symbols and stray tokens no longer abort an
    import; header-less games stay separate; comments before the first move or a variation survive.
  - Typed moves accept `nf3`, `a8=q` and `B2c3`, and `e8` promotes to a queen when “Always promote
    to a queen” is on (Analyze included); otherwise the input asks for the piece.
- **Board:** boards no longer go dead after a cancelled promotion, nor the capture and check drills
  after one move; the click-to-answer board and the Home hero board have the right square colours;
  drawn arrows survive updates; the drag marker no longer sticks; the eval bar is blank until there
  is a score and holds it between searches; nested variations no longer shrink; clocked games stop
  re-rendering the board ten times a second.
- **Play and coach**
  - **The coach judges at full strength**, no longer calls checkmate a blunder and no longer
    misjudges quick moves with a search cut short.
  - Take back is disabled once the game is over (it recorded the game twice); alerts and the
    promotion picker close at game over and no longer stack.
  - **Handicap, arcade and Simul games no longer count as engine games** for the ladder, courses and
    Progress: each game records where it was played.
  - Arcade games leave the Play setup alone; keyboard entry keeps focus; blindfold pieces return at
    game over; analysis opens from your side; weak levels stay weak on a short clock; the engine no
    longer flags in long games; stale hints are dropped; a crashed engine offers Retry at the same
    level; unplayable start positions are refused; the ladder clears slips and keeps climbed rungs.
- **Opening practice and repertoires:** the book really favours the moves you know least; leaving it
  twice at one move alerts twice; both clocks stop during the alert; hints follow the repertoire; a
  forgotten move is no longer treated as new; misses are said to return in ten minutes; an
  unreadable saved repertoire can be copied or deleted instead of crashing its page.
- **Classics:** four hidden notes appear; wrong notes in the Evergreen Game, Steinitz–von Bardeleben
  and Bernstein–Capablanca are corrected; a restart mid-judgement no longer plays a stray move.
- **Analyze and game review**
  - **Missed and allowed mates are flagged** and discovered attacks recognised; a flagged move is
    searched again from the position before it, so Morphy’s 15.Bxd7+ is no longer an inaccuracy; the
    engine sees repetitions; searches cut short are retried, not trusted.
  - The tablebase’s “mate in N” counts moves, not half-moves, and its errors are in words; arrow
    keys on the evaluation graph move one ply; “Move up” drops an outdated review, and deleting a
    side variation keeps it; copied links keep the start position and variations, and long ones
    warn; stale engine lines no longer linger.
  - Variant games are skipped on import; the board editor keeps move counters and refuses impossible
    material; page keys ignore menus, dialogs and modifier keys; king safety reads the right side’s
    files; the explorer explains when it is offline and has a real switch; a loading engine and a
    disabled “Review game” are explained.
- **My games:** an engine failure stops “Review all” with one message, Stop stops the search and
  Retry is offered; filters restart paging; chess.com pages read at most six archives; the
  repertoire check handles uncovered Black games and transpositions.
- **Learn and courses**
  - **Three lessons taught losing lines** (“Trade the attacker”, “Trade the defender” and the
    Philidor “textbook draw”) and are rebuilt; about twenty more wrong statements and every material
    count that contradicted its diagram are corrected.
  - Endgame tasks accept moves that are just as good, and failure texts no longer call sound moves
    losing; two lessons that judged …Nh6 differently now agree.
  - **Recall:** “Show answer” counts as a miss, and “Hint” shows its arrows before grading.
  - Course checkpoints no longer re-lock; “Restart lesson” keeps the completion; the placement
    result is followed; skipped tasks end in “End of lesson” with “Go to step N”; progress is kept
    by step id; the placement quiz counts its questions right, matches its thresholds to their
    labels, and “Open the course” finishes onboarding.
- **Home and Progress:** puzzle figures cover your whole history, not the last 300 attempts; a weak
  theme must trail your own accuracy by 15 points over 20 attempts and never replaces the daily
  plan’s rated puzzles; the weekly summary covers seven days, not eight; strengths and weaknesses no
  longer overlap; glossary and FAQ text is formatted and corrected; Reference fits phones.
- **Puzzles**
  - **Puzzles work offline band by band:** each band is dealt across its chunks by rating, so the
    precached first chunk spans the whole band, and every mode plays from whatever has loaded.
  - H and S ignore typed squares and Ctrl/Cmd+S and work in either case; “Show solution” no longer
    auto-advances; a replayed daily puzzle keeps the first result; underpromotions ask for the
    piece; by-opening cards train every opening listed.
  - A correct rated solve never lowers the rating; Woodpecker misses stay out of the review queue;
    the day streak is current; Rush’s clock pauses during downloads and Enter starts a run; on
    phones the Rush timer and the coordinates prompt sit above the board; stopping the offline
    download is no failure, and leaving Settings no longer stops it.
  - The mode strip wraps on phones, theme links are bigger, and only rated mode asks for a rating.
- **Drills, patterns and studies:** a promotion counts once the piece is safe; hold and capture
  drills judge material after the reply; the two-rooks drill survives a lost rook; endgame drills
  start from a random position; the hook-mate diagram has one mate; study solutions wait for your
  move, and Replay starts clean.
- **Arcade**
  - **Odds Ladder** rungs are readable rows and draws count as played; **Engine Says** keeps the
    score after a full line and works with a screen reader.
  - **Simul:** leaving asks first and a reload resigns the boards in play; N keeps focus; a board
    ended by your move stays in view; resigned boards stop their search; replies are announced one
    by one; a stalled engine offers Retry.
  - **Daily Opening** tiles pass contrast in dark and black, with glyphs, spoken labels and a
    legend; answers match their entries; midnight no longer changes a game under way; played days
    stay played; broken streaks are not shown.
  - Hand & Brain’s status messages no longer swap; Fortress grades the last move before counting it
    and asks before “Give up”; Blindfold hides captured material.
- **Settings, lab and sound:** the lab’s storage fill is removed when you leave the lab and at the
  next start; the threaded-engine switch shows “Reload now” only when needed, reverts when it cannot
  be saved and tells a browser with no service worker so; no sound or vibration before your first
  tap; overlapping sounds no longer clip, and sound resumes after a call.
- **Accessibility**
  - **Visible focus:** an opaque outline replaces a ring below 3:1, focus and controls show in
    Windows High Contrast, and focused controls no longer hide under the header or the bottom bar.
  - **Toasts are announced**, show their tone and appear above dialogs; typed squares no longer fire
    page shortcuts; move announcements are right after jumps; boards explain their keys; view-only
    boards describe their position; the promotion picker is modal.
  - Dialogs have a close button, and a confirmation opened over one leaves it open; touch screen
    readers find switches where they are drawn; segmented controls are radio groups; the More menu
    is a disclosure; the click-to-answer board is one tab stop; lesson step dots are proper buttons;
    hints belong to their fields; progress bars speak words, not byte counts.
  - Text alternatives for captured material, hint arrows, ladder rungs, the weekly trend, Rush
    strikes and the Army Draft budget; engine lines are announced once; read-only move lists are
    text; the evaluation graph and the Who Stands Better? slider speak their values; drill results
    are announced, and focus is kept after Next, drills, lesson steps and mode changes; the keyboard
    cursor and the explorer bar have more contrast, and the eval bar is wider, with a border;
    bottom-bar labels and the eval-bar score are 12 px; reduced motion is respected; the not-found
    page has a heading.
- **App, PWA and platform**
  - **Pages open at the top** and Back restores your place; the skip link keeps share links intact.
  - Large phones held sideways get the landscape layout; the colour scheme no longer flashes at
    start; the layout respects iPhone safe areas and 320 px screens, where a button that does not
    fit beside its text moves to a line of its own instead of spilling out of its card; iOS no
    longer zooms text areas.
  - “Reload now” works on a first visit and reloads only its own tab; runtime caches check what they
    store and expire; the crash page confirms copying and explains an out-of-date app, and a crash
    inside a page keeps the navigation; “Not now” on the install banner lasts 30 days, and the
    installed app is recognised in every display mode; the shortcut list matches the pages; link
    previews have an absolute image address and Open Graph and Twitter tags.
- **Licensing and engineering:** `package.json` says GPL-3.0-or-later, not MIT; `setup-engine.mjs`
  keeps `version.json` current; the scripts’ engine runner is safe in parallel and never hangs;
  `npm run e2e:visual` runs on Windows.

### Security

- **Content Security Policy** in a meta tag on the built app: scripts only from the site,
  connections only to the site and four Lichess and chess.com services; the service worker adds
  `frame-ancestors 'none'`.
- Share links are bounded (1 MiB expanded, 200 Woodpecker puzzles, 80-character names); browsers
  without compression support are told they cannot open compressed links; source links from imports
  must be https links to lichess.org or chess.com; the chess.com import fetches only the player’s
  own archives; requests time out after 15 seconds and honour Retry-After; backups over 50 MB and
  PGN files over 20 MB are refused unread.
- GitHub Actions are pinned to commit SHAs and installs skip package scripts; SECURITY.md links
  private vulnerability reporting.

### Testing

- Unit tests for every state-machine hook (the endgame drill game and Hand & Brain included), the
  backup schema, the migrations, the PGN parser, the board, the service worker and the build
  scripts; CI enforces a coverage floor, and a nightly run fails on flaky tests.
- Nine end-to-end specs for this release, run on all four browser projects (Firefox and WebKit
  included); the accessibility sweep adds the black scheme, fourteen parameterised routes and the
  not-found page; the manifest’s icons and screenshots are checked at their stated sizes.
- The compatibility test covers every backup format from 2 to 7 and older saved stores.
- Lesson tests replay every quoted line and cap steps at 130 words, and no scripted reply may throw
  away more than 300 cp.
- End-to-end tests wait on the app’s own signals and on the board’s animations instead of fixed
  timeouts.

## [0.11.0] - 2026-10-02

A simul: several engines at once, each on its own board.

### Added

- **Simul**, the ninth arcade game: two to eight games against Stockfish at once, each on its own
  board, the way a simul giver walks the room. Choose the strength (or let it rise a level per
  board), your colour (White, Black or alternating) and the clocks.
- **A clock per board.** With clocks on, every board has its own clock for each side, as in a clock
  simul. Yours runs on every board where it is your move — even while you are playing another one —
  so each board you add makes your time go faster; the setup shows roughly how many seconds a move
  you will have. The engine's clock runs only while it is thinking, never while it waits its turn,
  and its thinking time is cut to fit what it has left. Untimed simuls stay an option.
- Small boards show every game, its state and your clock on it. Tap one to play it, or press **N**
  for the next board waiting for you; after each move the next waiting board comes up by itself
  (a switch turns that off). One engine answers the boards in the order they started waiting, and
  replies on a board you are not looking at are announced to screen readers.
- Every finished board is recorded in the engine game log on Progress (the last 50 games against
  the engine), not under My games. The summary lists each board's result with an Analyze button,
  and the score to beat counts each win by its board's level (1 to 8) and a draw by half.

### Fixed

- **A flag against a bare king is a draw.** In Play, running out of time when the opponent could not
  checkmate by any series of legal moves — a lone king, say — is now a draw rather than a loss, as
  the rules say.
- After the engine failed to start, **Retry** starts a fresh engine instead of showing the same
  error again.
- Analyze and My games no longer load the Play page's code just to hand a game to the analysis
  board.

### Testing

- Unit tests for the simul model (clocks that start at once, increments, the engine's clock only
  while it searches, flags and the bare-king draw, the engine's time budget, the order boards come
  up in, scoring, PGN headers), for the runner (the engine queue, replies and announcements, saving,
  clocks under fake timers, a failed engine coming back, promotions), for the flag rule and for the
  engine Retry. An end-to-end spec plays a two-board simul through moving on, **N**, resigning, the
  summary, the hand-off to Analyze and the hub score; checks that every board keeps its own clocks;
  sets up alternating colours with rising strength; and lets every flag fall — on all four browser
  projects. The accessibility sweep covers the simul page.

## [0.10.0] - 2026-10-01

Board and display preferences, after a look at what the Lichess app offers.

### Added

- **Move notation.** Moves are written with figurines by default — the piece drawn from whichever
  piece set is active, so ♘f3 looks like the knight on your board — in every move list, engine line,
  explorer and tablebase table, coach and review explanation, lesson and feedback text. _Settings →
  Appearance → Move notation_ switches to letters. The letter stays in the page for screen readers,
  searches and copying, and stored games, PGN and share links always use letters.
- **Black colour scheme.** The dark scheme on a pure black background, for OLED screens; the header
  toggle cycles through system, light, dark and black, and the browser chrome follows.
- **Two more piece sets**, both original: **Modern** (flat silhouettes with a single outline weight)
  and **Pixel** (an 8-bit set with crisp edges, a match for the Retro sounds). Sets are picked from
  strips showing every set on the current board colours.
- **Four more board colours:** purple, olive, ice and walnut.
- **Drag feel:** the dragged piece is magnified under the finger, a circle or square marks the square
  it is over, and pieces can be moved by tap, by drag, or either. Keyboard control works in every
  mode.
- **Board highlights** (last move and check) can be turned off.
- **Captured material** beside the player bars shows the difference only (an exchange of knights
  shows nothing), every capture, or nothing.
- **Focus mode** hides the header and navigation while a game against the engine is on; the setting
  is in _Play_, and a Focus button on the Play page toggles it mid-game. The chrome comes back when
  the game ends or the page is left.
- A **Board** card in Settings gathers the board colours, piece sets and board behaviour; Appearance
  keeps the colour scheme, notation and sounds.

### Changed

- The classic cburnett set is now served from the app's own stylesheet (generated from the
  Chessground package by `scripts/generate-pieces.mjs`, with the same selectors as every other set)
  so the picker can show it next to the rest.
- The bundle budget now limits the start-up code as a sum — the entry chunk plus what it imports
  statically — instead of the entry file alone, since the bundler moves code between those chunks
  from release to release (this release's start-up code is 51 KB gzipped, up 0.4 KB).

### Testing

- Unit tests for the notation parser and the figurine components, the material modes, the board
  settings (highlights, magnifier, drag target, move method, keyboard in drag-only mode), the colour
  schemes and the focus store; an end-to-end spec switches notation, scheme, piece set and palette
  and checks persistence, turns highlights off, drags with the magnifier and target, moves by tap
  only, and runs a game in focus mode — on all four browser projects.

## [0.9.4] - 2026-10-01

### Changed

- **Repository clean-up.** Dead code is gone: a duplicate move-navigation component, two unused
  chess helpers, two test seams nothing used, a duplicated own-puzzle cap, a few unused constants,
  and the unused Tabs and drill styles. The puzzle
  reindex script is wired up as `npm run puzzles:reindex`, `chrome-launcher` (used by the
  Lighthouse script) is declared instead of relied on transitively, `tsconfig.node.json` no longer
  lists a file that does not exist, and the changelog is formatted like every other document.
- **Dependencies.** The GitHub Actions used by the workflows are on their current majors (checkout
  and setup-node 7, upload-artifact 7, download-artifact 8, configure-pages 6, upload-pages-artifact
  and deploy-pages 5), which also settles the open Dependabot pull requests; `@types/node` is on 26;
  Dependabot groups future Actions updates into one pull request. A transitive `basic-ftp` advisory
  under Lighthouse's Puppeteer is closed with an override to the patched line, so `npm audit` is
  clean again.
- The Lighthouse script now says that nothing is serving the preview instead of auditing a page of
  zeros.

### Testing

- `npm run lint:dead` (knip) fails on files nothing imports, exports nothing uses and dependencies
  that are missing from or unused in `package.json`; it runs in `check` and in CI.

## [0.9.3] - 2026-10-01

### Fixed

- **The placement quiz's options rendered as a run of inline checkboxes** when the quiz was the
  first page opened. Its option styles lived in the Puzzles page's stylesheet, which only loads with
  that page. The same leak affected the narrow onboarding column on the course, recall and study
  pages, the results card in Classics and repertoire training, the games overview, the board column
  of Who Stands Better?, the feedback and action rows of studies, and the engine diagnostics panel
  in the test lab. The shared pieces are now part of the always-loaded stylesheets (a choice list,
  a stat grid, a narrow column and a summary card), and the rest load the stylesheet they need.

### Testing

- A stylesheet-scope test follows every code-split page's static imports and fails if a component
  uses a class defined only in a stylesheet that page does not load, so this cannot come back.

## [0.9.2] - 2026-10-01

### Added

- **Retro sound theme.** A third theme next to Standard and Soft: an 8-bit console's sound chip,
  with square waves for the melody, triangles underneath for body and the noise channel for the
  explosion. A menu blip for a move and two blips for castling, an explosion for a capture, a siren
  pair for check, a power-up run for a promotion, a coin and a rising flourish for a solve, four steps
  down and a buzz for a miss, a four-note cadence for game over, a hurry-up tick for low time and a
  two-note question for a notification. It is level-matched to the standard set, so switching themes
  does not change how loud the app is, and it has its own shorter, buzzier vibration patterns.
- **Volume.** A slider under the sound theme in Settings (and in the test lab) sets the master volume
  in steps of 5 %. It is perceptual — half way sounds about half as loud — and a move plays at the new
  level once the slider settles.
- **A game-over cue for a loss.** Game over now tells a win from a loss: the standard theme plays
  its impact under a major chord for a win or a draw and under a minor chord that sinks for a loss;
  the retro cadence rises into the major chord or falls into the minor one. Engine games (checkmate,
  the flag and resignation) and Hand & Brain use it; between two people at one device the neutral
  cue plays.

### Changed

- The test lab's haptics card shows the patterns of the current sound theme, and its sounds card
  carries the volume slider.

### Testing

- Unit tests cover the retro set (chip waves only, noise only in the explosion, level matching with
  the capture on top), the major-versus-minor game-over pair, the volume curve, the per-theme
  vibration patterns and the new controls; an end-to-end test switches to Retro, moves the slider
  from the keyboard and checks that both persist and that the lab follows them, on all four browser
  projects.

## [0.9.1] - 2026-10-01

### Changed

- **Every sound rebuilt on a new synth.** The synth gained filtered-noise layers and a "punch" chain
  (a compressor and a soft clipper that squeeze a cue's layers into one dense sound), and all ten
  cues were redesigned on it as one family: a wooden thock for a move and a double thock for
  castling; a **capture that lands like a hit** — kick-drum thump, sub, crack, crunch, debris and the
  bright tick, the loudest sound in the set; an alarm with a crack on each note for check; a short
  fanfare with sparkle for a promotion; a ringing chime for a solve; a heavy thud and a slide down for
  a miss; an impact under a swelling chord for game over; a weighted tick for low time; a two-note
  ping with air for a notification. Levels are matched so the capture stays on top and a move is the
  quietest. The audio context now wakes on the first tap so even the first hit lands at full weight;
  the soft theme keeps halved, dulled versions without the punch chain. The capture vibration is a
  double tap followed by a longer buzz.

### Testing

- The visual-snapshot job is blocking now that its baselines have matched the CI runner.

## [0.9.0] - 2026-10-01

The release candidate for 1.0: everything below is what 1.0 will ship, and the compatibility promise
starts here — a backup made by this version imports into every later version, and a share link made
by this version keeps opening.

### Added

- **A test lab** (_Settings → Open the test lab_, `/settings/lab`) for checking a device by hand:
  every platform capability (installed app, service worker, WebAssembly, shared memory, audio,
  vibration, badge, sharing, compression, CSS features, viewport, storage estimate), the storage
  meter with a fill-to-the-limit test, a button for every sound and every haptic cue, every icon at
  four sizes on light and dark, every control, badge, alert, toast and the dialog, the board colours,
  piece sets, highlights, arrows and the promotion menu, the type scale and colour tokens, the engine
  diagnostics, and a deliberate crash to see the error page.
- **Storage that survives a full disk.** Browsers cap local storage at about 5 MB; when a write no
  longer fits, the app now keeps running, warns once ("Storage is full…") and shows the failure in
  Settings instead of silently dropping the change. Settings shows how much local data the app keeps.
- **A crash page that reports itself:** the version, build date, route, browser and the stack, with
  "Copy details", "Go home" and a bug-report link whose form is already filled in.
- **A privacy and data note** in Settings and the FAQ: what stays on the device (everything), what
  leaves it and when (only the imports and lookups you trigger), what a backup is and how much the app
  can store.
- **Three more browsers in CI.** Firefox and WebKit run the shell, engine, arcade, settings, lab,
  small-phone and accessibility tests alongside desktop and mobile Chromium, each in its own job.
- **Budgets in CI:** `npm run bundle:check` fails the build when a gzipped chunk or the precache
  outgrows its limit; `npm run lighthouse` audits five pages and fails on an accessibility,
  best-practices or SEO regression, a layout shift above 0.1 or a serious performance drop.
- **Visual snapshots** (`npm run e2e:visual`) of the static pages on desktop and phone, compared in
  CI as an informative job until the baselines are confirmed on the runner.
- **Compatibility fixtures:** real backups from the 0.3, 0.5 and 0.7 export formats and share links
  from 0.4 and 0.6 are imported and decoded in the unit suite on every run.

### Changed

- While a page chunk loads, the loading screen is taller than the window, so the footer no longer
  appears at the bottom and jumps away (Lighthouse's layout shift went from 0.12 to 0).
- The install banner's "Not now" button no longer carries a label that contradicts its text.

## [0.8.0] - 2026-10-01

### Added

- **Arcade.** Eight games that are not puzzles, each with a score to beat, under _More → Arcade_:
  - **Hand & Brain** — full-strength Stockfish as your partner. As the Brain you call a piece type and
    the partner plays its best move with that piece; as the Hand the partner names the piece of its best
    move and you find the move. Every call is graded against the engine's real best (best, good,
    inaccuracy, mistake, blunder) and the game ends with an accuracy figure. Opponent at any level.
  - **Daily Opening** — one line a day from the 3,800-line opening book, six guesses, Wordle-style
    feedback per move (right place, elsewhere in the line, not in it), the known prefix shown on the
    board, hints that unlock with wrong guesses, a streak, a shareable text result, and a practice mode.
  - **Who Stands Better?** — ten quiet positions from the classic games, judged on a ±5-pawn slider
    against the engine's evaluation (515 positions evaluated at depth 16); points for closeness, nothing
    for calling the wrong side, a streak bonus and the engine's move revealed each time.
  - **Odds Ladder** — full-strength Stockfish gives queen odds; a win climbs to rook, knight, bishop and
    pawn odds and finally a level game. Results per rung, no take-backs, no hints.
  - **Army Draft** — both sides buy an army from a points budget (20, 30 or 39) and fight from the
    first two ranks; presets, a live preview, and the engine's own random draft (or a mirror of yours).
  - **Fortress** — hold a clearly worse position for twenty moves against a chosen level; the
    evaluation (graded at full strength after every move) is the health bar, three lives, positions
    tiered from "a pawn or so down" to "on the brink".
  - **Engine Says** — a Simon game: the engine plays the first moves of a real opening line, the board
    resets, you replay them; every round adds a move, and finishing a line carries on with a new one.
  - **Blindfold** — a full game against the engine with the pieces hidden and three two-second peeks;
    a win with peeks to spare is the top score.
- The arcade hub shows every game's best result; the Progress page lists them; the daily plan includes
  the Daily Opening.
- `public/openings/lines.json`: every opening line's moves (from the same lichess-org/chess-openings
  import), for the games that quiz them.
- `npm run arcade:positions` evaluates the classic games' middlegame positions with the engine for
  Who Stands Better? and Fortress (`src/features/arcade/positions.json`).
- Backups (export version 6) include arcade results, the Daily Opening streak and the odds ladder.

### Changed

- **Settings has its own page.** Appearance, play, engine and analysis, the puzzle rating, profiles,
  backups and the app itself moved from the bottom of the Progress page to _More → Settings_
  (`/settings`), each in its own card; the Progress page is statistics only, in two columns, with a
  button to Settings. The profile badge opens Settings.
- **The More menu is grouped** — Train, Games and App/Tools — as three columns on a desktop and a
  titled bottom sheet on a phone (which never grows past the screen).
- **Phones held upright keep the whole board on screen.** Pages with a board get a compact title,
  and the ones that explain themselves further down (Play, Puzzles, Analyze, the arcade games) drop
  the description, so on a 375 × 667 screen the board, both player bars and the first controls all
  fit between the app header and the bottom bar without scrolling.
- **Finger-sized controls on touch screens:** small buttons, segmented controls, the board-colour
  swatches and the breadcrumb links grow to at least 40 px when the pointer is a finger; the Army
  Draft shop keeps its − count + stepper on one line.
- Every link that looks like a button now is one (`LinkButton`): the "All games", "All drills",
  "Analyze" and similar links on the drill and arcade result cards used to render as plain text.
- The framework (React, React DOM, React Router) is built as its own chunk, so an app update
  re-downloads about 33 KB (gzipped) of app code instead of 128 KB.
- The README is a project overview with screenshots; the full feature reference moved to
  `docs/FEATURES.md`, the scripts table to `CONTRIBUTING.md` and the branding notes to
  `docs/DEPLOYMENT.md`.

### Testing

- An automated accessibility sweep (`e2e/axe.spec.ts`, axe-core WCAG 2.1 A/AA) over every top-level
  page in both colour schemes; it found and fixed four things — `aria-label` on plain containers
  (the repertoire progress bars and captured-material rows), the move lists' list role, and a
  stray contrast check on a fading toast.
- The engine-dependent end-to-end tests use positions with one right answer (a missed mate in one, a
  queen given away), so a transposition-table mood can no longer change their outcome.

### Fixed

- On a phone, every move scrolled the page down to the move list and the board slid off the screen
  (most visibly when playing on from a puzzle). Move lists now scroll only themselves.
- The engine client put `searchmoves` before the search limits in the `go` command; Stockfish reads
  every token after `searchmoves` as a move, so such searches never ended.

## [0.7.0] - 2026-09-30

### Added

- **Endgame library, three times the size.** Forty-one endgame drills, every position engine-verified:
  pawn endings (the square of the pawn, key squares, connected and outside and protected passed pawns,
  triangulation, the breakthrough, Réti's manoeuvre), rook endings (rook against a pawn from both sides,
  cutting off the king, the short-side and back-rank defences, rook and two pawns, rook against bishop and
  against knight), queen endings (against knight pawn, bishop or rook pawn, knight and bishop) and minor
  pieces (the right and the wrong bishop, knight against a pawn, bishop against two pawns, opposite
  bishops with split pawns), plus the two-rook ladder mate. The **endgame ladder** orders them as rungs,
  tracks what is climbed, links each to its theory lesson and feeds the daily plan.
- **Engine ladder** on the Play page: which levels you have beaten, the next rung with a one-click game,
  a step down after three straight losses, and results per level on the Progress page.
- **Opening practice games.** _Practise vs engine_ from any repertoire: the opponent follows the
  repertoire's lines (weighted towards the moves you know least), the engine takes over when the book runs
  out, and leaving the book pauses the game with a take-back and a lapse in the review queue.
- **Puzzles by opening.** Every puzzle carries its opening; practise the tactics of a family or variation,
  from your repertoires' openings, or from the daily plan's "Tactics from the …" item.
- **Insights from your games.** Reviews are digested into phases, mistake types, colours, openings and
  engine levels; the _Work on_ list turns the biggest gaps into lessons and puzzle themes.
- **Position report** on the analysis board: material, pawn structure, king safety, open files, outposts
  and loose pieces, with plans for both sides and lesson links; hovering highlights the squares.
- **Woodpecker sets.** A fixed set of 50, 100 or 200 puzzles solved in spaced cycles, with time and
  accuracy per cycle and the improvement spelled out.
- **Mating patterns.** A gallery of the nineteen named mates (Anastasia's, Arabian, back-rank, Balestra,
  blind swine, Boden's, corner, double bishop, dovetail, epaulette, hook, kill box, Morphy's, Opera,
  Pillsbury's, smothered, swallow's tail, triangle, Vuković), each a minimal engine-checked diagram with
  what to look for, a link to the library's puzzles of that shape, and a drill that runs through them.
- **Twelve lessons:** attacking the fianchetto, defending the Greek gift, bishop endgames, pawn endgames
  III, the bishop-and-knight mate, queen versus rook, rook and bishop versus rook, Catalan and Queen's
  Gambit plans, French structures, exchange sacrifices II, calculation III and "when there is nothing to
  do" — 72 engine-verified tasks, in new course units.
- **Sixteen classic games** from Légal's mate and the Immortal Draw to Réti–Alekhine, Torre–Lasker,
  Capablanca–Tartakower, Botvinnik–Tal 1960 and Karpov–Unzicker, with **era, difficulty and played
  filters**.
- **Analysis library.** Save an analysis under a name and a collection, reopen, rename, share or delete
  it; a pasted Lichess study export saves every chapter as a collection.
- **Share links** for repertoires and Woodpecker sets: the whole thing travels compressed in the link.
- **Profiles.** Several learners on one device, each with their own progress, repertoires, games and
  library; switch from the Progress page.

### Changed

- **Icons instead of emoji** throughout the interface (navigation, feature cards, difficulty stars,
  move-list controls, theme toggle).
- **Board coordinates** moved off the squares into a gutter beside and below the board: rank numbers
  down the left, file letters along the bottom, each centred on its square, never under a piece and
  readable on every theme. The eval bar lines up with the playing surface.
- Endgame drills show the position you are about to play behind the Start card instead of the
  initial position.
- The "Install app" button uses an icon instead of a text glyph; the pawn (Play) and knight icons are
  redrawn.
- The daily plan's drill picks the next rung of the endgame ladder; the Drills page shows rungs and
  per-group progress; each drill page links to the theory lesson and the next rung.
- The nine mating-pattern themes that had no name are now named and described in the puzzle catalogue.
- Backups (export version 5) include the analysis library.
- Updates reach returning visitors sooner: the app checks for a new build whenever it comes back
  into view and loads a ready update at the next in-app navigation, not only on a reload.
- Pushing a version tag publishes a GitHub release with the changelog notes.

### Fixed

- Clicks on the board are mapped against its current position: after a scroll or a layout shift
  above the board a click could land on the wrong square.

## [0.6.0] - 2026-09-30

### Added

- **48,000 puzzles.** Six times more tactics, sampled 6,000 per rating band with the ids of the previous
  set kept so histories and review queues stay valid. Puzzles are served in chunks of 500: the first chunk
  of every band is precached and the rest are cached as they are used, or all at once with _Settings →
  Download every puzzle_ (with progress, cancel and a status that survives reloads).
- **Move commentary.** Game review explains every judged move in words — hanging pieces (static exchange
  evaluation), forks, pins and skewers, discovered checks, missed and allowed mates, what the best move
  would have won — each with a link to the lesson and the puzzle theme; key moments carry a one-line why.
- **Coach mode.** Untimed games against the engine pause after a mistake or blunder (or any missed or
  allowed mate) with the same explanation, the lesson link and a take-back; the engine's reply waits.
  On by default for new games, switchable in the setup and in Settings.
- **Opening explorer** (opt-in, network): what masters or Lichess players play in the current position,
  with results and top games, on the analysis board and in the repertoire explorer. Clicking a move plays
  it.
- **Repertoire building.** _Add line to repertoire_ on the analysis board merges the current line into a
  custom repertoire or starts a new one; custom repertoires have an _Edit lines_ mode with a movable board,
  explorer suggestions, per-move notes, "make main line" and "delete from here".
- **Twelve lessons:** knight endgames, rook against a pawn, passed pawns in the middlegame, bishop
  against knight, the initiative, transitions into the endgame, defending worse positions, zwischenzug and
  quiet moves, plans in the Sicilian, plans in the King's Indian, practical play and the clock, attacking
  with opposite-coloured bishops — 66 new engine-verified tasks, many from Lichess games, in new course
  units.
- **Six repertoires:** Ruy Lopez, Vienna, Alapin, Nimzo-Indian, King's Indian and Najdorf. Every learner
  move in all sixteen repertoires was checked against the engine; the flagged lines in five older
  repertoires were repaired.
- **Fifteen classic games:** Lasker–Thomas, Levitsky–Marshall, Réti–Bogoljubov, Bernstein–Capablanca, the
  Immortal Zugzwang, Adams–Torre, Alekhine–Nimzowitsch, Paulsen–Morphy, Zukertort–Blackburne,
  Spassky–Bronstein, Robert Byrne–Fischer, Fischer–Benko, Botvinnik–Portisch, Petrosian–Spassky 1966 and
  Deep Blue–Kasparov.
- **Placement quiz** (`/placement`): five questions and three positions produce a recommended course,
  first lessons, puzzle themes to practise and a starting rating for the calibration run.
- **Device transfer.** Share a backup straight to another device (Web Share API) where supported; the
  installed app opens `.json` backups from the file manager and imports them; a reminder appears after 40
  rated puzzles or two weeks without a backup, and Settings shows the last backup date.
- **App icon badge** with the number of due reviews (puzzles, lesson recall and repertoire moves), with a
  setting.
- **Haptic feedback** on moves, solves and mistakes on phones (setting).
- **Layouts** for phones held sideways (board and panel side by side, compact chrome) and for notches and
  rounded corners (safe-area insets).

### Changed

- Settings gained `haptics`, `appBadge`, `playCoach`, `explorer`, `explorerDatabase`, `lastBackupAt` and
  `lastBackupAttempts` (defaults merged into existing saves); the progress store gained `placement`.
- Reviewed moves keep the position, the best line and the reply line so they can be explained.
- The repertoire explorer follows a path of moves rather than the tree cursor, so edits do not lose the
  place.
- The calibration run can start from a given rating (used by the placement quiz).
- Engine verification (`NodeEngine.analyse`) caps every search at 90 seconds and each lesson task gets
  five minutes, so a position with a long forced mate no longer times out and throws the rest of the run
  out of step.
- "Download every puzzle" retries a chunk that fails to download (three attempts with a short pause),
  waits for the service worker to finish writing the cache before reporting, and says how many files
  are missing if some could not be stored.
- E2E: the review-queue test reads the first puzzle chunk; the my-games test expects the Caro-Kann
  deviation now that 3. Bb5 follows the Ruy Lopez repertoire.

## [0.5.0] - 2026-09-30

### Added

- **Glicko-2 puzzle rating.** The rating now carries an uncertainty (shown as "± 60" everywhere it
  appears) and a volatility, and is updated with the system Lichess uses, verified against the worked
  example in Glickman's paper. The puzzle's own rating deviation from the Lichess data weights each
  result.
- **Calibration run.** New learners can let twelve rated puzzles find their level instead of guessing it
  (a self-assessment is still available and starts less uncertain); the Progress page can restart a
  calibration at any time.
- **What an attempt is worth** now depends on how it went: hints cost credit according to what they
  revealed (the piece: 0.6, the whole move: 0.25), a solve that was slow for the puzzle's size and
  difficulty earns less (never below 0.75), and a puzzle seen before applies only a quarter of its
  update.
- **Inactivity.** The deviation grows during breaks (a settled rating becomes provisional again after
  about a year away), so a returning learner's first solves count more.
- **What the rating means.** A Progress card converts the puzzle rating into rough Lichess, chess.com
  and FIDE ranges (±150), with the caveats spelled out; the FAQ explains the ± figure.

### Changed

- The puzzle rating is consistently called a _puzzle_ rating; "provisional" now means the deviation is
  at least 110 rather than "fewer than 30 rated puzzles".
- Progress store version 5 and export version 4: older saves and exports get a deviation derived from
  how many rated puzzles their Elo rating had seen, and the last rated time from the rating history.
- Attempts record the hint level and the Glicko score they were worth.

### Removed

- The Elo K-factor schedule (`updateRating`, `kFactor`, `PROVISIONAL_GAMES`).

## [0.4.0] - 2026-09-30

### Added

- **Puzzles from your own games:** every mistake or blunder found by a game review (Analyze or My games)
  can become a puzzle — one click per moment or "Add N as puzzles" for the whole game — and a new
  **Mine** mode on the Puzzles page drills them; solved and failed ones follow the 1-3-7-14-30 review
  schedule. Any puzzle can be **bookmarked** (☆) into the same queue.
- **My games** (`/games`): import games from Lichess or chess.com (time control, colour and rated
  filters, "load older games"), or paste a PGN; an overview of results, **opening statistics** per colour
  by family, a **repertoire tab** that shows where you or your opponents left the lines you study
  (deviated / opponent left / in book, with "study line" and "analyze position" links), one-click
  **review of every game** in a batch, and "add as puzzles" for the mistakes found.
- **Home:** the daily plan adapts — it targets your weakest puzzle theme when the accuracy drops below
  70 %, rotates through every drill, and adds due lesson recalls; the current course and its next item
  are shown.
- **Progress:** a **weekly summary** (puzzles, accuracy, lessons, games, drills, training days, rating
  change against the previous week) and an **engine diagnostics** panel (build in use, WebAssembly, cores,
  isolation, service worker) with a "Test the engine" speed check.
- **Courses:** First steps, Club player and Strategy & calculation — guided paths of lessons, drills,
  puzzle and repertoire targets, engine games and classic games, with units that unlock in order and a
  "Continue" button that goes to the next item.
- **Lesson recall:** three days after finishing a lesson its tasks come back as recall cards
  (`/learn/recall`); a miss brings the card back sooner and "reread the lesson" jumps to the step.
- **Learn:** eight lessons — pawn endgames II (breakthrough, outflanking, the spare tempo), rook endgames
  III (cutting the king off, checking from behind, Vancura), how to study openings, good and bad bishops,
  opposite-side castling (with Karpov–Korchnoi 1974), converting an extra pawn, candidate moves and
  elimination (Réti–Tartakower and Marshall's Qg3), and planning from the pawn structure (hanging pawns
  and the Maróczy Bind) — 33 engine-verified tasks, all placed in the courses.
- **Endgame studies** (`/studies`): eight composed positions with a single solution — Réti's king walk,
  the Saavedra position, the classic breakthrough, knight underpromotion, one pawn down, the rook's
  last trick and two only-move king endings — solved move by move with hints, notes after every move,
  "play it out" against the engine and a record of clean solves. Every line is verified by
  `npm run studies:verify`.
- **Guess the position** drill: the opening of a famous game as text, an empty board, and three questions
  about where the pieces stand now (captures, castling and en passant included).
- **Play:** **two players at one device** (the board can turn towards the side to move; the side to move
  resigns; games are not counted as engine games) and **blindfold** play with a peek button and a peek
  counter.
- **Classic games:** Capablanca–Marshall 1918 (the Marshall Attack), Lasker–Capablanca 1914,
  Short–Timman 1991 (the king walk) and Fischer–Spassky 1972, game 6.
- **Openings:** French Defence and English Opening repertoires.
- **Keyboard board control:** Tab to any board, move a square cursor with the arrow keys, select a piece
  and its destination with Enter, clear with Escape, or type a square name to jump to it; a visually
  hidden "Describe position" button reads the whole position out. The shortcuts dialog lists it.
- **Shareable links:** "Copy link" on the analysis board puts the game (deflated) or the position in the
  URL fragment — `/analyze#z=…&ply=N` — so nothing is sent anywhere and the link opens at the same move.
- **Appearance:** an original **Letters** piece set (high legibility on small boards) and a **soft**
  sound theme.

### Changed

- The lesson content is no longer loaded on the Home, Progress and course pages: a generated index
  (`src/features/learn/lessonMeta.ts`, `npm run lessons:index`, run before every build) carries the
  titles and lengths, which keeps ~55 kB of gzipped JavaScript off the first page load.
- Toasts stay in the bottom-right corner on wide screens so they never cover the board.
- Interactive boards expose `role="application"` with a description; view-only boards stay images.
- The "My games" and "Endgame studies" pages are in the More menu; the Play page header describes both
  opponents.
- Progress export version 3 (adds own puzzles, lesson recall and study results); the store migrates
  older saves.

### Fixed

- A reply animation could swallow the next click on the board in the studies e2e flow; the tests now
  dismiss toasts and wait for the animation.
- `useNow()` re-reads the clock when the review queue changes, so due counts update immediately after a
  bookmark or a solve.
- Opening a shared game at a given move no longer depends on stale tree state (`loadPgn(pgn, atPly)`).

## [0.3.0] - 2026-09-29

### Added

- **Game review:** an evaluation graph (click or use the arrow keys to jump to any move), a list of key
  moments (the biggest mistakes, one click away), a choice of review depth with a time estimate, and a
  "retry from here against the engine" link on every reviewed move.
- **Play from any position:** start a game from a FEN (`/play?fen=…`), from any position on the analysis
  board, from a lesson diagram, from a solved puzzle or from a moment of a reviewed game. Custom starts show
  the correct move numbers and hide the material count.
- **Import games:** paste or open a PGN with several games and pick one, or fetch the most recent games of
  a Lichess or chess.com player by username (public APIs, nothing uploaded; usernames are remembered).
- **Puzzle review queue:** missed puzzles (rated, themed, daily or rush) come back after 1, 3, 7, 14 and 30
  days; a hint keeps the card on its step. The Puzzles page shows the due count, the Progress page counts
  the queue and the daily plan includes it.
- **Home:** a first-run tour, a daily plan (daily puzzle, five rated puzzles, review queue, opening reviews,
  the next lesson and a drill) and a training-day streak across every activity.
- **Learn:** eight lessons — the isolated queen's pawn, outposts and weak squares, the minority attack,
  fortresses and zugzwang, rook against a minor piece, queen endgames, attacking the uncastled king and
  visualisation — with 27 engine-verified tasks.
- **Drills:** Vancura, wrong bishop (hold), bishop and knight in the wrong corner, queen vs rook and queen
  vs pawn (win the last piece); a blindfold mode for the board-vision drills.
- **Classic games:** Byrne–Fischer (the Game of the Century), Botvinnik–Capablanca, Karpov–Kasparov 1985
  (the Octopus Knight) and Kasparov–Topalov.
- **Openings:** King's Indian Attack and Slav Defence repertoires.
- **Multi-threaded engine (experimental):** a hand-written Workbox service worker (`src/sw.ts`) that can add
  the COOP/COEP headers itself, so the pthreads Stockfish build runs on GitHub Pages when the learner opts
  in; the thread count is shown in the analysis status line and the app falls back to the single-threaded
  build automatically.
- **Accessibility:** every move is announced to screen readers, a keyboard-shortcut reference (`?`), focus
  moves to the new page after navigation, a colour-blind-safe high-contrast board theme (Okabe–Ito
  highlights), `prefers-reduced-motion` disables board animation, and text colours meet WCAG AA contrast.

### Changed

- The review queue keeps the last card on the board until "Next" so the solution can be studied.
- Tall dialogs scroll inside the dialog instead of pushing the title off screen.
- Game review depth is a setting (fast / balanced / thorough).
- Endgame drill positions are checked in CI to be legal and to not start in check.

### Fixed

- Two lesson tasks that Stockfish rated below the accepted tolerance at depth 18: the queenside
  castling example now uses a Sicilian Yugoslav Attack position where O-O-O is the best move, and the
  Blackburne Shilling "decline the bait" task no longer accepts c3.
- The threaded engine's worker scripts are served with the isolation headers too (a dedicated worker
  must be at least as isolated as the page that spawns it).

## [0.2.0] - 2026-09-29

### Added

- **Play:** clocks with bullet, blitz, rapid and classical time controls (loss on time, engine think
  time capped by its remaining time, low-time warning), keyboard move entry, "show threat", automatic
  level suggestions after two wins or two losses in a row.
- **Analysis:** full variation tree (play a move from anywhere to create a variation; promote, delete,
  annotate with glyphs and comments; PGN export with variations), keyboard navigation, ECO opening names,
  board editor with position validation, PGN download, optional Lichess tablebase lookups (off by default).
- **Puzzles:** Puzzle Rush (3-minute and survival modes), per-theme accuracy with a strengths and
  weaknesses report on the Progress page, and a puzzle set doubled to 8,000 (1,000 per rating band).
- **Drills:** coordinate trainer, piece-movement / find-every-capture / find-every-check drills, and
  checkmate and endgame drills (KQ, KR, two bishops, bishop and knight, king and pawn win and hold,
  Lucena, Philidor) played against the full-strength engine with automatic adjudication and best results.
- **Openings:** repertoire trainer with six built-in repertoires (Italian, London, Queen's Gambit,
  Caro-Kann, Queen's Gambit Declined, Scandinavian), custom PGN import, SM-2 spaced repetition, an
  explore mode and due/learned statistics.
- **Classic games:** guess-the-move for seven annotated masterpieces with engine grading of alternatives.
- **Learn:** fourteen new lessons (draws and how games end, opening traps, trading pieces, pawn races,
  minor-piece endgames, opposite-coloured bishops, queen vs pawn, rook endgames II, the active king,
  building a repertoire, space and pawn breaks, the exchange sacrifice, the bishop pair, analysing your
  games); every lesson task is now verified against Stockfish by `npm run lessons:verify`.
- **Reference:** rules of chess, notation (SAN, PGN, FEN, engine evaluations), searchable glossary and FAQ.
- Sound effects (synthesised, no audio files), a settings switch for them, and a redesigned navigation
  with a "More" menu on desktop and a bottom sheet on phones.

### Changed

- Progress export now includes the opening repertoire data; importing an older export still works.
- The Home page presents all sections; the Progress page has a training summary card.

### Fixed

- Two beginner lesson positions where the taught move was objectively poor (the examples now keep the
  balance so the engine agrees with the lesson).

## [0.1.0] - 2026-09-29

### Added

- Interactive lesson curriculum (21 lessons across beginner, intermediate and advanced levels) with
  engine-verified positions and per-step progress tracking.
- Puzzle trainer with 4,000 bundled Lichess puzzles, rating-aware selection, an Elo-style rating,
  daily puzzle, practice by theme, hints, solutions and day streaks.
- Play against Stockfish 19 (WASM) at eight strength levels with take-backs, hints, resignation,
  PGN export and hand-off to the analysis board.
- Analysis board with multi-line evaluation, evaluation bar, FEN/PGN import and one-click game
  review (accuracy, inaccuracies, mistakes, blunders, better moves).
- Progress page with rating history chart, statistics, recent puzzles/games, settings and JSON
  export/import.
- Progressive Web App: manifest, icons, offline precaching of the whole app (engine and puzzles
  included), install prompt, update notifications.
- GitHub Actions workflows for CI (lint, typecheck, unit + e2e tests, build) and GitHub Pages deployment.
