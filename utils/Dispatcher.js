var dispCbs = [];
var dispIns = [];

function Dispatcher() {
	dispIns.push(this);
	dispCbs.push({});
}
Dispatcher.prototype = {
	on(type, cb) {
		let cbtypes = dispCbs[dispIns.indexOf(this)];
		let cbs = cbtypes[type] = (cbtypes[type] || []);
		if (!~cbs.indexOf(cb)) {
			cbs.push(cb);
		}
	},
	off(type, cb) {
		let cbtypes = dispCbs[dispIns.indexOf(this)];
		let cbs = cbtypes[type] = (cbtypes[type] || []);
		if (cbs.length > 0) {
			cbs.pop()
		}
	},
	fire(type, ...args) {
		let cbtypes = dispCbs[dispIns.indexOf(this)];
		let cbs = cbtypes[type] = (cbtypes[type] || []);
		for (let i = 0; i < cbs.length; i++) {
			cbs[i].apply(null, args);
		}
	}
};
module.exports = Dispatcher;