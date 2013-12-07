# Letterwang

Multiplayer word-spelling game.

## Rules

Two players take turns adding letters to the end of the letter stream.
Each time a player adds a letter that causes a word to be spelled at the
end of the stream, they are awarded points corresponding to the length
of the word spelled.

### Example

```
Player 1: l
Player 2: a
Player 1: t
Player 2: e
Player 2 is awarded 2 points (late)
Player 1: r
Player 1 is awarded 3 points (later)
Player 2: a
Player 1: l
Player 1 is awarded 5 points (lateral)
Player 2: l
Player 2 is awarded 1 points (all)
Player 1: y
Player 1 is awarded 7 points (laterally)
Player 1 is awarded 3 points (rally)
Player 1 is awarded 2 points (ally)
```

## Setup

```
npm install -g grunt-cli
npm install
node app.js
```

To run in production:

```
grunt cssmin uglify
NODE_ENV=production node app.js
```

To deploy to Heroku:

```
heroku labs:enable websockets
heroku labs:enable user-env-compile
heroku config:set BUILDPACK_URL=https://github.com/mbuchetics/heroku-buildpack-nodejs-grunt.git
heroku config:set NODE_ENV=production
```

## License

Copyright © 2013, Curtis McEnroe <programble@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
