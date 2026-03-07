/**
 * EZRestAPI: a formal approach to REST management of EZDG entities.
 *
 * 1. Follow CRUD standards
 * 2. Given a `$rootUrl`, entities can be read & mutated as follows:
 *    1. `GET $rootUrl/$entity`: query & fetch all $entity entities
 * 			 1. querystring will contain app-specific key-values for querying
 *    2. `POST $rootUrl/$entity`: create new entity
 *    3. `GET $rootUrl/$entity/$id`: fetch single entity
 *    4. `PUT $rootUrl/$entity/$id`: update existing entity
 * 		5. `DELETE $rootUrl/$entity/$id`: delete existing entity
 * 3. Responses will have 3 basic structures:
 *    1. `{error: {errorMap: Record<string,string>, _model:string}}`
 *    2. `{entities: Entity[], pagination: {}}`
 *    3. `{...entityData}`
 *
 * ## Future Enhancements
 *
 * - batch updates
 */

import { DataStore, EZDGError, isStructError } from './types';

export const parseResponseOrThrow = async (
	response: Response
): Promise<any> => {
	const status = response.status;
	const body = response.headers
		.get('content-type')
		?.startsWith('application/json')
		? await response.json()
		: {};
	if (isStructError(body)) {
		console.warn('parseResponseOrThrow', response, body);
		throw new EZDGError(body.error.errorMap, `response-parse`);
	} else if (status !== 200) {
		console.warn(`parseResponseOrThrow(${status})`);
		throw new EZDGError({
			'*': `response-status(${status}): ${response.statusText}`,
		});
	}
	return body;
};

/**
 *
 * @param entityRootUri
 * @returns
 * @todo basic response validation
 */
export const getEZRestApiEntityStore = (entityRootUri: string): DataStore => {
	return {
		fetchPage: async (params) => {
			return await parseResponseOrThrow(
				await fetch(
					`${entityRootUri}?searchParamsJson=${JSON.stringify(
						params ?? {}
					)}`
				)
			);
		},

		fetchRow: async (id) => {
			return await parseResponseOrThrow(
				await fetch(`${entityRootUri}/${id}`)
			);
		},

		createRow: async (data) => {
			return await parseResponseOrThrow(
				await fetch(entityRootUri, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(data),
				})
			);
		},

		updateRow: async (data) => {
			return await parseResponseOrThrow(
				await fetch(`${entityRootUri}/${data._id}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(data),
				})
			);
		},

		deleteRow: async (data) => {
			const response = await fetch(`${entityRootUri}/${data.id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});
			if (response.status !== 200) {
				throw new Error(
					`deleteRow: status=${response.status} for id=${data.id}`
				);
			}
			return data;
		},
	};
};

export const getEZRestApiEntityStoreProvider = (rootUri: string) => {
	const escache: Record<string, DataStore> = {};

	return {
		getEntityStore: (entity: string) => {
			if (!escache[entity]) {
				escache[entity] = getEZRestApiEntityStore(
					`${rootUri}/${entity}`
				);
			}
			return escache[entity];
		},
	};
};
