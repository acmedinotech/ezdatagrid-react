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

import { BatchUpdateArgs, BatchUpdateProgressIncrement, DataStore, EZDGError, isStructError, StructRecordAny } from './types';

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
	let lastFetchedPage: StructRecordAny[] = [];

	const updateRow = async (data: StructRecordAny) => {
		return await parseResponseOrThrow(
			await fetch(`${entityRootUri}/${data._id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			})
		);
	};
	
	return {
		getCurrentPage: () => lastFetchedPage,
		fetchPage: async (params) => {
			const response = await parseResponseOrThrow(
				await fetch(
					`${entityRootUri}?searchParamsJson=${JSON.stringify(
						params ?? {}
					)}`
				)
			);
			lastFetchedPage = response.entities;
			return response;
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

		updateRow,

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
		batchUpdateRows: async ({ patch, selectedRows, progressCallback }) => {
			// @todo allow callback for updates
			let success = 0;
			let errors: StructRecordAny = {};
			const updatedRows: StructRecordAny[] = [];

			const prog: BatchUpdateProgressIncrement = {
				success: 0,
				errors: 0,
				total: 0,
			}
			prog.total = Object.keys(selectedRows).length;
			progressCallback?.(prog);

			const promises = Object.entries(selectedRows).filter(([id, value]) => value).map(row => new Promise(async (resolve, reject) => {
				try {
					const response = await updateRow({ _id: row[0], ...patch })
					progressCallback?.({ ...prog, success: ++prog.success });
					success++
					updatedRows.push(response);
					resolve(response);
				} catch (error) {
					errors[row[0]] = error;
					progressCallback?.({ ...prog, errors: ++prog.errors });
				}
			}));

			await Promise.all(promises);
			console.log('batchUpdateRows', { patch, selectedRows, success, errors, updatedRows });
			return {
				success,
				errors,
				updatedRows,
			};
		}
	}
}

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
