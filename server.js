var express = require('express');
var _ = require('underscore');
var db = require('./db.js')
var bodyParser = require('body-parser');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

//GET ROOT
app.get('/', function(req, res) {
	res.send('Todo API Root');
});

// GET /todos?completed=true&q=house
app.get('/todos', function(req, res) {
	var query = req.query;
	var where = {};

	if(query.hasOwnProperty('completed') && query.completed === 'true') {
		where.completed = true;
	} else if (query.hasOwnProperty('completed') && query.completed === 'false') {
		where.completed = false;
	}

	if(query.hasOwnProperty('q') && query.q.length > 0) {
		where.description = {
			$like: '%' + query.q + '%'
		};
	}

	db.todo.findAll({where: where}).then(function(todos) {
		res.json(todos);
	}, function (e) {
		res.status(500).send();
	});
});

//GET /todos/:id Check out underscore docs
app.get('/todos/:id', function(req, res) {
	var todoid = parseInt(req.params.id, 10);
	db.todo.findById(todoid).then(function (todo) {
		if(!!todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).send();
		}
	}, function(e) {
		res.status(500).send();
	});
})

//POST
app.post('/todos', function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	//Call create on db.todo
	db.todo.create(body).then(function (todo) {
		res.json(todo.toJSON());
	}, function(e) {
		res.json.status(400).json(e);
	});
});

//DELETE
app.delete('/todos/:id', function(req, res) {
	var todoid = parseInt(req.params.id, 10);
	var matchedTodo = _.findWhere(todos, {
		id: todoid
	});

	if (matchedTodo) {
		todos = _.without(todos, matchedTodo);
		res.json(matchedTodo)
			//res.json();
	} else {
		res.status(404).json({
			"error": "no todo found with that id"
		});
	};
});

//PUT
app.put('/todos/:id', function(req, res) {
	var todoid = parseInt(req.params.id, 10);
	var matchedTodo = _.findWhere(todos, {
		id: todoid
	});
	var body = _.pick(req.body, 'description', 'completed');
	var validAttributes = {};

	if (!matchedTodo) {
		return res.status(404).send();
	}

	if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
		validAttributes.completed = body.completed;
	} else if (body.hasOwnProperty('completed')) {
		return res.status(400).send();
	}

	if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
		validAttributes.description = body.description;
	} else if (body.hasOwnProperty('description')) {
		return res.status(400).send();
	}

	_.extend(matchedTodo, validAttributes);
	res.json(matchedTodo);

});

db.sequelize.sync().then(function () {
	app.listen(PORT, function() {
		console.log('Express listening on port ' + PORT + "!");
	});
});

