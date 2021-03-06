/* jslint browser */
/* global jasmine, sinon, spyOn, expect */

define([
	'squire',
	'jquery',
	'underscore',
	'moment',
	'Config',
	'utils/geoSpatialUtils',
	'models/BaseDatasetCollection',
	'models/BaseVariableCollection'
], function(Squire, $, _, moment, Config, geoSpatialUtils, BaseDatasetCollection, BaseVariableCollection) {
	"use strict";

	describe('models/WorkflowStateModel', function() {
		var injector;
		var WorkflowStateModel, testModel;

		var fetchGLCFSSpy, resetGLCFSSpy, selectGLCFSAllVarsSpy, unselectGLCFSAllVarsSpy;
		var fetchPrecipSpy, resetPrecipSpy, selectPrecipAllVarsSpy, unselectPrecipAllVarsSpy;
		var fetchSiteSpy, resetSiteSpy, selectSiteAllVarsSpy, unselectSiteAllVarsSpy;
		var fetchACISSpy, resetACISSpy, selectACISAllVarsSpy, unselectACISAllVarsSpy;
		var fetchGLCFSDeferred, fetchPrecipDeferred, fetchSiteDeferred, fetchACISDeferred;

		beforeEach(function(done) {
			fetchGLCFSSpy = jasmine.createSpy('fetchGLCFSSpy');
			resetGLCFSSpy = jasmine.createSpy('resetGLCFSSpy');
			selectGLCFSAllVarsSpy = jasmine.createSpy('selectGLCFSAllVarsSpy');
			unselectGLCFSAllVarsSpy = jasmine.createSpy('unselectGLCFSAllVarsSpy');

			fetchPrecipSpy = jasmine.createSpy('fetchPrecipSpy');
			resetPrecipSpy = jasmine.createSpy('resetPrecipSpy');
			selectPrecipAllVarsSpy = jasmine.createSpy('selectPrecipAllVarsSpy');
			unselectPrecipAllVarsSpy = jasmine.createSpy('unselectPrecipAllVarsSpy');

			fetchSiteSpy = jasmine.createSpy('fetchSiteSpy');
			resetSiteSpy = jasmine.createSpy('resetSiteSpy');
			selectSiteAllVarsSpy = jasmine.createSpy('selectSiteAllVarsSpy');
			unselectSiteAllVarsSpy = jasmine.createSpy('unselectSiteAllVarsSpy');

			fetchACISSpy = jasmine.createSpy('fetchACISSpy');
			resetACISSpy = jasmine.createSpy('resetACISSpy');
			selectACISAllVarsSpy = jasmine.createSpy('selectACISAllVarsSpy');
			unselectACISAllVarsSpy = jasmine.createSpy('unselectACISAllVarsSpy');

			fetchGLCFSDeferred = $.Deferred();
			fetchPrecipDeferred = $.Deferred();
			fetchSiteDeferred = $.Deferred();
			fetchACISDeferred = $.Deferred();

			injector = new Squire();

			injector.mock('models/GLCFSCollection', BaseDatasetCollection.extend({
				fetch : fetchGLCFSSpy.and.returnValue(fetchGLCFSDeferred.promise()),
				reset : resetGLCFSSpy,
				selectAllVariablesInFilters : selectGLCFSAllVarsSpy,
				unselectAllVariablesInFilters : unselectGLCFSAllVarsSpy
			}));
			injector.mock('models/PrecipitationCollection', BaseDatasetCollection.extend({
				fetch : fetchPrecipSpy.and.returnValue(fetchPrecipDeferred.promise()),
				reset : resetPrecipSpy,
				selectAllVariablesInFilters : selectPrecipAllVarsSpy,
				unselectAllVariablesInFilters : unselectPrecipAllVarsSpy
			}));
			injector.mock('models/NWISCollection', BaseDatasetCollection.extend({
				fetch : fetchSiteSpy.and.returnValue(fetchSiteDeferred.promise()),
				reset : resetSiteSpy,
				selectAllVariablesInFilters : selectSiteAllVarsSpy,
				unselectAllVariablesInFilters : unselectSiteAllVarsSpy
			}));
			injector.mock('models/ACISCollection', BaseDatasetCollection.extend({
				fetch : fetchACISSpy.and.returnValue(fetchACISDeferred.promise()),
				reset : resetACISSpy,
				selectAllVariablesInFilters : selectACISAllVarsSpy,
				unselectAllVariablesInFilters : unselectACISAllVarsSpy
			}));
			injector.mock('utils/geoSpatialUtils', geoSpatialUtils);
			spyOn(geoSpatialUtils, 'getBoundingBox').and.returnValue({
				west : -100.0,
				south : 43.0,
				east : -99.0,
				north : 44.0
			});

			injector.require(['models/WorkflowStateModel'], function(model) {
				WorkflowStateModel = model;

				testModel = new WorkflowStateModel();
				done();
			});
		});

		afterEach(function() {
			injector.remove();
		});

		it('Expects that calling initializeDatasetCollections initializes the datasetCollections property', function() {
			testModel.initializeDatasetCollections();

			expect(testModel.attributes.datasetCollections[Config.NWIS_DATASET]).toBeDefined();
			expect(testModel.attributes.datasetCollections[Config.PRECIP_DATASET]).toBeDefined();
			expect(testModel.attributes.datasetCollections[Config.ACIS_DATASET]).toBeDefined();
			expect(testModel.attributes.datasetCollections[Config.GLCFS_DATASET]).toBeDefined();
		});

		describe('Tests for getSitesWithSelectedVariables', function() {
			it('Expects an empty array if dataCollections have not been initialized', function() {
				expect(testModel.getSelectedVariables()).toEqual([]);
			});

			it('Expects an empty array if dataCollections is empty', function() {
				testModel.initializeDatasetCollections();
				expect(testModel.getSelectedVariables()).toEqual([]);
			});

			it('Expects model containing the sites to be returned if variables are selected', function() {
				testModel.set('datasetCollections', {
					NWIS : new BaseDatasetCollection([
						{siteNo : '04453',
						 variables : new BaseVariableCollection([
								{selected : true, x : 1, variableParameter : {siteNo : '04453'}},
								{selected : true, x : 2, variableParameter : {siteNo : '04453'}}
						])},
						{siteNo : '12399',
						 variables : new BaseVariableCollection([
								{x: 3, variableParameter : {siteNo : '12399'}}
						])}
					]),
					PRECIP : new BaseDatasetCollection([
						{siteNo : '9:56',
						 variables : new BaseVariableCollection([
							{selected: true, x : 4, variableParameter : {siteNo : '9:56'}}
						])}
					])
				});
				var result = testModel.getSitesWithSelectedVariables();
				expect(result.length).toEqual(2);
			});
		});

		describe('Tests for getSelectedVariables', function() {
			it('Expects that an empty array is returned if the datasetCollections have not been initialized', function() {
				expect(testModel.getSelectedVariables()).toEqual([]);
			});

			it('Expects that if the datasetCollections have been defined but contain empty collections that an empty array is returned', function() {
				testModel.initializeDatasetCollections();

				expect(testModel.getSelectedVariables()).toEqual([]);
			});

			it('Expects that if the datasetCollections contains variables but none are selected that the empty array is returned', function() {
				testModel.set('datasetCollections', {
					NWIS : new BaseDatasetCollection([
						{variables : new BaseVariableCollection([
								{startDate : moment('2001-01-04', Config.DATE_FORMAT), endDate : moment('2007-11-04', Config.DATE_FORMAT)},
								{startDate : moment('2003-04-03', Config.DATE_FORMAT), endDate : moment('2012-01-04', Config.DATE_FORMAT)}
						])},
						{variables : new BaseVariableCollection([
								{startDate : moment('2006-01-04', Config.DATE_FORMAT), endDate : moment('2008-01-04', Config.DATE_FORMAT)}
						])}
					]),
					PRECIP : new BaseDatasetCollection([
						{variables : new BaseVariableCollection([
							{startDate : moment('1998-01-04', Config.DATE_FORMAT), endDate : moment('2007-01-04', Config.DATE_FORMAT)}
						])}
					])
				});

				expect(testModel.getSelectedVariables()).toEqual([]);
			});

			it('Expects that if some of the variables in the datasetCollections are selected they will be returned', function() {
				var result;
				testModel.set('datasetCollections', {
					NWIS : new BaseDatasetCollection([
						{variables : new BaseVariableCollection([
								{selected : true, x : 1},
								{x: 2}
						])},
						{variables : new BaseVariableCollection([
								{x: 3}
						])}
					]),
					PRECIP : new BaseDatasetCollection([
						{variables : new BaseVariableCollection([
							{selected: true, x : 4}
						])}
					])
				});
				result = testModel.getSelectedVariables();

				expect(result.length).toBe(2);
				expect(_.find(result, function(variable) {
					return variable.attributes.x === 1;
				})).toBeDefined();
				expect(_.find(result, function(variable) {
					return variable.attributes.x === 4;
				})).toBeDefined();
			});
		});

		describe('Tests for model event handlers to update the datasets', function() {
			var updateStartSpy, updateFinishedSpy, resetSpy;
			beforeEach(function() {
				updateStartSpy = jasmine.createSpy('updateStartSpy');
				updateFinishedSpy = jasmine.createSpy('updateFinishedSpy');
				resetSpy = jasmine.createSpy('resetSpy');

				testModel.initializeDatasetCollections();

				testModel.get('aoi').set({latitude : '43.0', longitude : '-100.0', radius : '5'}),
				testModel.set('datasets', ['NWIS']);

				testModel.on('dataset:updateStart', updateStartSpy);
				testModel.on('dataset:updateFinished', updateFinishedSpy);

				fetchSiteSpy.calls.reset();
				fetchPrecipSpy.calls.reset();
				resetSiteSpy.calls.reset();
				resetPrecipSpy.calls.reset();
			});

			afterEach(function() {
				testModel.off('dataset:updateStart');
				testModel.off('dataset:updateFinished');
			});

			it('Expects the dataset models to be cleared and not fetched if there is not a valid bounding box', function() {
				testModel.get('aoi').set('radius', '');

				expect(fetchSiteSpy).not.toHaveBeenCalled();
				expect(fetchPrecipSpy).not.toHaveBeenCalled();
				expect(resetSiteSpy).toHaveBeenCalled();
				expect(resetPrecipSpy).toHaveBeenCalled();
			});

			it('Expects the dataset model to be cleared and not fetched if there are no datasets chosen', function() {
				testModel.set('datasets', []);

				expect(fetchSiteSpy).not.toHaveBeenCalled();
				expect(fetchPrecipSpy).not.toHaveBeenCalled();
				expect(resetSiteSpy).toHaveBeenCalled();
				expect(resetPrecipSpy).not.toHaveBeenCalled();
			});

			it('Expects if there is a valid boundingBox and a dataset is added that dataset is fetched', function() {
				testModel.set('datasets', ['NWIS', 'PRECIP']);

				expect(fetchSiteSpy).not.toHaveBeenCalled();
				expect(fetchPrecipSpy).toHaveBeenCalled();
				expect(resetSiteSpy).not.toHaveBeenCalled();
				expect(resetPrecipSpy).not.toHaveBeenCalled();
			});

			it('Expects that if a dataset is removed from the chosen datasets, that dataset is cleared', function() {
				testModel.set('datasets', ['NWIS', 'PRECIP']);
				fetchSiteSpy.calls.reset();
				fetchPrecipSpy.calls.reset();
				resetSiteSpy.calls.reset();
				resetPrecipSpy.calls.reset();
				testModel.set('datasets', ['NWIS']);

				expect(fetchSiteSpy).not.toHaveBeenCalled();
				expect(fetchPrecipSpy).not.toHaveBeenCalled();
				expect(resetSiteSpy).not.toHaveBeenCalled();
				expect(resetPrecipSpy).toHaveBeenCalled();
			});

			it('Expects that a dataset:updateStart event will be triggered if there is a valid bounding box regardless as whether a dataset chosen.', function() {
				updateStartSpy.calls.reset();
				testModel.set({
					datasets : [Config.NWIS_DATASET, Config.PRECIP_DATASET]
				});
				expect(updateStartSpy).toHaveBeenCalled();

				updateStartSpy.calls.reset();
				testModel.set({
					datasets : []
				});
				expect(updateStartSpy).toHaveBeenCalled();

				testModel.set({
					datasets : [Config.NWIS_DATASET]
				});
				expect(updateStartSpy).toHaveBeenCalled();
			});

			it('Expects an dataset:updateFinished event handler will be called with an empty array once all of the chosen datasets have been fetched', function(done) {
				updateFinishedSpy.calls.reset();
				fetchSiteDeferred.resolve();
				setTimeout(function() {
					expect(updateFinishedSpy).toHaveBeenCalled();
					done();
				}, 100);
			});

			it('Expects that if any of the dataset fetches failed, the event handler will be called with the array of failed datasets', function(done) {
				fetchSiteDeferred.reject();
				setTimeout(function() {
					expect(updateFinishedSpy).toHaveBeenCalledWith([Config.NWIS_DATASET]);
					done();
				}, 100);
			});

			it('Expects that a dataset:updateFinished event handler will be called with an empty array if no datasets have been chosen', function() {
				fetchSiteDeferred.resolve();
				updateFinishedSpy.calls.reset();
				testModel.set({
					datasets : []
				});

				expect(updateFinishedSpy).toHaveBeenCalledWith([]);
			});
		});

		//Disabling these tests as two of these tests fail in Chrome but not Firefox.
		xdescribe('Tests for updating the variableKinds property', function() {
			var updateStartSpy, updateFinishedSpy, resetSpy;
			beforeEach(function() {
				updateStartSpy = jasmine.createSpy('updateStartSpy');
				updateFinishedSpy = jasmine.createSpy('updateFinishedSpy');
				resetSpy = jasmine.createSpy('resetSpy');

				testModel.initializeDatasetCollections();

				testModel.get('aoi').set({latitude : '43.0', longitude : '-100.0', radius : '5'}),
				testModel.set('variableKinds', []);

				testModel.on('dataset:updateStart', updateStartSpy);
				testModel.on('dataset:updateFinished', updateFinishedSpy);

				fetchSiteSpy.calls.reset();
				fetchACISSpy.calls.reset();
				fetchPrecipSpy.calls.reset();
				resetSiteSpy.calls.reset();
				resetACISSpy.calls.reset();
				resetPrecipSpy.calls.reset();

				jasmine.clock().install();
			});

			afterEach(function() {
				jasmine.clock().uninstall();
				testModel.off('dataset:updateStart');
				testModel.off('dataset:updateFinished');
			});

			it('Expects that if variableKinds changes to add a variable, the appropriate datasets are fetched', function() {
				testModel.set('variableKinds', ['maxTemperature']);

				expect(fetchSiteSpy).toHaveBeenCalled();
				expect(fetchACISSpy).toHaveBeenCalled();
				expect(fetchPrecipSpy).not.toHaveBeenCalled();
			});

			it('Expects that once fetching is complete the datasets that have the variable have selectAlLVariablesInFilter called', function() {
				testModel.set('variableKinds', ['maxTemperature']);
				fetchSiteDeferred.resolve();
				fetchACISDeferred.resolve();
				jasmine.clock().tick(500);
				expect(selectSiteAllVarsSpy).toHaveBeenCalled();
				expect(selectACISAllVarsSpy).toHaveBeenCalled();
			});

			it('Expects that if a variable is removed, that unselect is called for the datasets that are in that variable type', function() {
				testModel.set('variableKinds', ['maxTemperature', 'precipitation']);
				fetchSiteDeferred.resolve();
				fetchACISDeferred.resolve();
				fetchPrecipDeferred.resolve();
				jasmine.clock().tick(500);
				testModel.set('variableKinds', ['maxTemperature']);
				fetchSiteDeferred.resolve();
				fetchACISDeferred.resolve();
				jasmine.clock().tick(500);

				expect(unselectACISAllVarsSpy);
				expect(unselectSiteAllVarsSpy);
				expect(unselectPrecipAllVarsSpy);
			});
		});

		describe('Tests for event handlers for updating the workflow step', function() {
			it('Expects that if the step changes to SPECIFY_AOI_STEP the dates and datasets properties are unset and the aoiModel properties are cleared', function() {
				var aoiModel = testModel.get('aoi');
				aoiModel.set({latitude : '43.0', longitude : '-100.0', radius : '6'});
				testModel.set({
					dataDateFilter : {
						start : moment('2010-04-11','YYYY-MM-DD'),
						end : moment('2016-04-15', 'YYYY-MM-DD')
					},
					datasets : [Config.NWIS_DATASET, Config.PRECIP_DATASET]
				});
				testModel.set('step', Config.SPECIFY_AOI_STEP);

				expect(aoiModel.attributes).toEqual({});
				expect(testModel.has('datasets')).toBe(false);
				expect(testModel.has('dataDateFilter')).toBe(false);
			});

			it('Expects that if the step changes to SPECIFY_AOI_STEP the datasetCollections will be cleared', function() {
				testModel.initializeDatasetCollections();
				resetSiteSpy.calls.reset();
				resetPrecipSpy.calls.reset();
				testModel.set('step', Config.SPECIFY_AOI_STEP);

				expect(resetSiteSpy).toHaveBeenCalled();
				expect(resetPrecipSpy).toHaveBeenCalled();
			});

			it('Expects that if the step changes to CHOOSE_DATA_BY_SITE_FILTERS_STEP and the previous step was SPECIFY_AOI_STEP that the chosen datasets are set', function() {
				testModel.set('step', Config.SPECIFY_AOI_STEP);
				testModel.get('aoi').set({latitude : '43.0', longitude : '-100.0', radius : 2});
				spyOn(testModel, 'initializeDatasetCollections').and.callThrough();
				testModel.set('step', Config.CHOOSE_DATA_BY_SITE_FILTERS_STEP);

				expect(testModel.get('datasets')).toEqual(['NWIS']);
				expect(testModel.initializeDatasetCollections).toHaveBeenCalled();
			});

			it('Expects that if the step changes to CHOOSE_DATA_BY_VARIABLES_STEP and the previous step was SPECIFY_AOI_STEP that the datasets are initalized', function() {
				testModel.set('step', Config.SPECIFY_AOI_STEP);
				testModel.get('aoi').set({latitude : '43.0', longitude : '-100.0', radius : 2});
				spyOn(testModel, 'initializeDatasetCollections').and.callThrough();
				testModel.set('step', Config.CHOOSE_DATA_BY_VARIABLES_STEP);

				expect(testModel.initializeDatasetCollections).toHaveBeenCalled();
			});

			it('Expects that if the step changes to CHOOSE_DATA_BY_SITE_FILTERS_STEP and the previous step was SPECIFY_AOI_STEP, the chosen datasets are fetched', function() {
				testModel.set('step', Config.SPECIFY_AOI_STEP);
				testModel.get('aoi').set({latitude : '43.0', longitude : '-100.0', radius : 2});
				fetchPrecipSpy.calls.reset();
				fetchSiteSpy.calls.reset();
				testModel.set('step', Config.CHOOSE_DATA_BY_SITE_FILTERS_STEP);

				expect(fetchPrecipSpy).not.toHaveBeenCalled();
				expect(fetchSiteSpy).toHaveBeenCalled();
			});


			it('Expects that if the step changes from CHOOSE_DATA_BY_SITE_VARIABLES_STEP to PROCESS_DATA_STEP, the defaults for the processing step are set', function() {
				spyOn(testModel, 'getSelectedVarsDateRange').and.returnValue({
					start : moment('01-01-2010', Config.DATE_FORMAT),
					end : moment('05-01-2015', Config.DATE_FORMAT)
				});
				testModel.set('step', Config.CHOOSE_DATA_BY_SITE_VARIABLES_STEP);
				testModel.set('step', Config.PROCESS_DATA_STEP);

				expect(testModel.has('outputDateRange')).toBe(true);
				expect(testModel.has('outputFileFormat')).toBe(true);
				expect(testModel.has('outputDateFormat')).toBe(true);
			});

			it('Expects that if the step changes to PROCESS_DATA_STEP and the startDate and endDate have values, these values will be used to set the initial value of the outputDateRange', function() {
				var result;
				testModel.set('dataDateFilter', {
					start : moment('2005-04-11', Config.DATE_FORMAT),
					end : moment('2010-05-01', Config.DATE_FORMAT)
				});
				testModel.set('step', Config.CHOOSE_DATA_BY_SITE_VARIABLES_STEP);
				testModel.set('step', Config.PROCESS_DATA_STEP);
				result = testModel.get('outputDateRange');

				expect(result.start.format(Config.DATE_FORMAT)).toEqual('2005-04-11');
				expect(result.end.format(Config.DATE_FORMAT)).toEqual('2010-05-01');
			});

			it('Expects that if the step changes to PROCESS_DATA_STEP and the startDate and/or endDate are not defined, the outputDateRange is set to the last month of the union of the selected variable date range', function() {
				var result;
				testModel.set('datasetCollections', {
					NWIS : new BaseDatasetCollection([
						{variables : new BaseVariableCollection([
								{selected : true, startDate : moment('2001-01-04', Config.DATE_FORMAT), endDate : moment('2007-11-04', Config.DATE_FORMAT)},
								{startDate : moment('2003-04-03', Config.DATE_FORMAT), endDate : moment('2012-01-04', Config.DATE_FORMAT)}
						])},
						{variables : new BaseVariableCollection([
								{selected : true, startDate : moment('2006-01-04', Config.DATE_FORMAT), endDate : moment('2008-01-04', Config.DATE_FORMAT)}
						])}
					]),
					PRECIP : new BaseDatasetCollection([
						{variables : new BaseVariableCollection([
							{selected : true, startDate : moment('1998-01-04', Config.DATE_FORMAT), endDate : moment('2007-01-04', Config.DATE_FORMAT)}
						])}
					])
				});
				testModel.set('step', Config.CHOOSE_DATA_BY_SITE_VARIABLES_STEP);
				testModel.set('step', Config.PROCESS_DATA_STEP);
				result = testModel.get('outputDateRange');

				expect(result.start.format(Config.DATE_FORMAT)).toEqual('2007-12-04');
				expect(result.end.format(Config.DATE_FORMAT)).toEqual('2008-01-04');
			});

			it('Expects that if the step changes to PROCESS_DATA_STEP when t startDate and/or endDate are not defined and the selected variables have a date range less than a month, then outputDateRange will be the dateRange of the selected variables', function() {
				var result;
				testModel.set('datasetCollections', {
					NWIS : new BaseDatasetCollection([
						{variables : new BaseVariableCollection([
								{selected : true, startDate : moment('2001-01-04', Config.DATE_FORMAT), endDate : moment('2001-01-20', Config.DATE_FORMAT)},
								{startDate : moment('2001-01-20', Config.DATE_FORMAT), endDate : moment('2012-01-04', Config.DATE_FORMAT)}
						])}
					])
				});
				testModel.set('step', Config.CHOOSE_DATA_BY_SITE_VARIABLES_STEP);
				testModel.set('step', Config.PROCESS_DATA_STEP);
				result = testModel.get('outputDateRange');

				expect(result.start.format(Config.DATE_FORMAT)).toEqual('2001-01-04');
				expect(result.end.format(Config.DATE_FORMAT)).toEqual('2001-01-20');
			});
		});

		describe('Tests for getSelectedVarsDateRange', function() {
			it('Expects that if the collections contains no datasetCollections property, then undefined is returned', function() {
				expect(testModel.getSelectedVarsDateRange()).toBeUndefined();
			});

			it('Expects that if the datasetCollections property contains no datasets, then undefined is returned', function() {
				testModel.set('datasetCollections', []);

				expect(testModel.getSelectedVarsDateRange()).toBeUndefined();
			});

			it('Expects that if the datasetCollections contain no selected data variables, then undefined is returned', function() {
				testModel.set('datasetCollections', {
					NWIS : new BaseDatasetCollection([
						{variables : new BaseVariableCollection([
								{startDate : moment('2001-01-04', Config.DATE_FORMAT), endDate : moment('2007-01-04', Config.DATE_FORMAT)},
								{startDate : moment('2003-04-03', Config.DATE_FORMAT), endDate : moment('2012-01-04', Config.DATE_FORMAT)}
						])},
						{variables : new BaseVariableCollection([
								{startDate : moment('2006-01-04', Config.DATE_FORMAT), endDate : moment('2008-01-04', Config.DATE_FORMAT)}
						])}
					]),
					PRECIP : new BaseDatasetCollection([
						{variables : new BaseVariableCollection([
							{startDate : moment('1998-01-04', Config.DATE_FORMAT), endDate : moment('2009-01-04', Config.DATE_FORMAT)}
						])}
					])
				});

				expect(testModel.getSelectedVarsDateRange()).toBeUndefined();
			});

			it('Expects that if the datasetCollections contain selected data variables, the date range returned is the union of the selected variables date range', function() {
				var result;
				testModel.set('datasetCollections', {
					NWIS : new BaseDatasetCollection([
						{variables : new BaseVariableCollection([
								{selected : true, startDate : moment('2001-01-04', Config.DATE_FORMAT), endDate : moment('2007-11-04', Config.DATE_FORMAT)},
								{startDate : moment('2003-04-03', Config.DATE_FORMAT), endDate : moment('2012-01-04', Config.DATE_FORMAT)}
						])},
						{variables : new BaseVariableCollection([
								{selected : true, startDate : moment('2006-01-04', Config.DATE_FORMAT), endDate : moment('2008-01-04', Config.DATE_FORMAT)}
						])}
					]),
					PRECIP : new BaseDatasetCollection([
						{variables : new BaseVariableCollection([
							{selected : true, startDate : moment('1998-01-04', Config.DATE_FORMAT), endDate : moment('2007-01-04', Config.DATE_FORMAT)}
						])}
					])
				});
				result = testModel.getSelectedVarsDateRange();

				expect(result.start.format(Config.DATE_FORMAT)).toEqual('1998-01-04');
				expect(result.end.format(Config.DATE_FORMAT)).toEqual('2008-01-04');
			});
		});
	});
});