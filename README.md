BattleIO
======

[![Join the chat at https://gitter.im/db-battle-io](https://badges.gitter.im/db-battle-io.svg)](https://gitter.im/db-battle-io?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

BattleIO is a game developed based in [IOGrid](https://github.com/jondubois/iogrid). This fork add more mechanics to game avatars.

<img alt="IOGrid demo" src="public/img/battle-io.gif" title="BattleIO demo" />

### Developing

The front-end code is in `public/index.html`, the back-end code is in `worker.js` and `cell.js`.
Read the comments in the code for more details about how it all works.

### Running

To run on your machine, you need to have Node.js `v6.0.0` or higher installed.
Then you can either clone this repo with Git using the command:

```
git clone git@github.com:dhiogoboza/battle-io.git
```

Once you have this repo setup in a `battle-io` directory on your machine, you need to navigate to it using the terminal and then run:

```
npm install
```

Then (while still inside the `battle-io` directory) you can launch the game server using:

```
node server
```

To run the demo, navigate to `http://localhost:8000` in a browser - You should see a rabbit which you can move around using the arrow keys.

To test the multi-player functionality from your localhost:

Open up another browser window/tab to `http://localhost:8000` and put it side-by-side with the first window/tab - You should now have two rabbits - Each one can be controlled from a different tab.

### Contributors
* [Dhiogo Boza](https://github.com/dhiogoboza) <dhiogoboza@gmail.com>
* [paulocosmico](https://github.com/paulocosmico)
* georgefcj

### Online version

The online version is available at [http://battle-of-power.herokuapp.com/](http://battle-of-power.herokuapp.com/).

## License

[MIT](LICENSE)
