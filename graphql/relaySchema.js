import {
	GraphQLBoolean,
	GraphQLSchema,
	GraphQLID,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLString,
	GraphQLEnumType,
} from 'graphql';

import {
	fromGlobalId,
	globalIdField,
	nodeDefinitions,
	connectionDefinitions,
	connectionFromPromisedArray,
	connectionArgs,
} from 'graphql-relay';

var keystoneTypes = require('./keystoneTypes');

var keystone = require('keystone');
var User = keystone.list('User');
var Organisation = keystone.list('Organisation');

var {nodeInterface, nodeField} = nodeDefinitions(
	(globalId) => {
		var {type, id} = fromGlobalId(globalId);

		switch (type) {
		case 'User':
			return User.model.findById(id).exec();
		case 'Organisation':
			return Organisation.model.findById(id).exec();
		default:
			return null;
		}
	},
	(obj) => {
		if (obj instanceof User.model) {
			return userType;
		} else if (obj instanceof Organisation.model) {
			return organisationType;
		}
		return null;
	}
);

var userType = new GraphQLObjectType({
	name: 'User',
	fields: () => ({
		id: globalIdField('User'),
		name: {
			type: new GraphQLNonNull(keystoneTypes.name),
		},
		// email: {
		// 	type: keystoneTypes.email,
		// 	resolve: (source) => ({
		// 		email: source.email,
		// 		gravatarUrl: source._.email.gravatarUrl,
		// 	}),
		// },
	}),
	interfaces: [nodeInterface],
});

var organisationType = new GraphQLObjectType({
	name: 'Organisation',
	fields: () => ({
		id: globalIdField('Organisation'),
		name: { type: GraphQLString },
		logo: { type: keystoneTypes.cloudinaryImage },
		website: { type: GraphQLString },
		isHiring: { type: GraphQLBoolean },
		description: { type: keystoneTypes.markdown },
		location: { type: keystoneTypes.location },
		members: {
			type: userConnection,
			args: connectionArgs,
			resolve: ({id}, args) => connectionFromPromisedArray(
				User.model.find().where('organisation', id).exec(),
				args
			),
		},
	}),
	interfaces: [nodeInterface],
});

var {
	connectionType: userConnection,
} = connectionDefinitions({
	name: 'User',
	nodeType: userType,
});
var {
	connectionType: organisationConnection,
} = connectionDefinitions({
	name: 'Organisation',
	nodeType: organisationType,
});

function modelFieldById (objectType, keystoneModel) {
	const modelIDField = `${objectType.name.toLowerCase()}ID`;
	return {
		type: objectType,
		args: {
			id: {
				description: `global ID of the ${objectType.name}`,
				type: GraphQLID,
			},
			[modelIDField]: {
				description: `MongoDB ID of the ${objectType.name}`,
				type: GraphQLID,
			},
		},
		resolve: (_, args) => {
			if (args[modelIDField] !== undefined && args[modelIDField] !== null) {
				return keystoneModel.model.findById(args[modelIDField]).exec();
			}

			if (args.id !== undefined && args.id !== null) {
				var {id: mongoID} = fromGlobalId(args.id);
				if (mongoID === null || mongoID === undefined ||
						mongoID === '') {
					throw new Error(`No valid ID extracted from ${args.id}`);
				}

				return keystoneModel.model.findById(mongoID).exec();
			}

			throw new Error('Must provide at least one argument');
		},
	};
}

var queryRootType = new GraphQLObjectType({
	name: 'Query',
	fields: {
		node: nodeField,
		organisation: modelFieldById(organisationType, Organisation),
		allOrganisations: {
			type: organisationConnection,
			args: connectionArgs,
			resolve: (_, args) => connectionFromPromisedArray(
				Organisation.model.find().exec(),
				args
			),
		},
		user: modelFieldById(userType, User),
		allUsers: {
			type: userConnection,
			args: connectionArgs,
			resolve: (_, args) => connectionFromPromisedArray(
				User.model.find().exec(),
				args
			),
		},
	},
});

export default new GraphQLSchema({
	query: queryRootType,
});
