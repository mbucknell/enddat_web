/* jslint browser: true */

define([
	'jquery',
	'underscore',
	'moment',
	'backbone',
	'loglevel',
	'module',
	'models/BaseDatasetCollection',
	'utils/rdbUtils'
], function ($, _, moment, Backbone, log, module, BaseDatasetCollection, rdbUtils) {
	"use strict";

	var parameterCodesPath = module.config().parameterCodesPath;

	var DATE_FORMAT = 'YYYY-MM-DD';

	var collection = BaseDatasetCollection.extend({

		url: '',

		initialize: function(models, options) {
			BaseDatasetCollection.prototype.initialize.apply(this, arguments);

			this.pCodePromise = this.getParameterCodes();
			this.sCodePromise = this.getStatisticCodes();
		},

		/*
		 * @param {Object with properties west, east, south, north} boundingBox
		 * @returns {Jquery promise}
		 *		@resolved with the JqXHR object when the NWIS sites for boundingBox have been fetched, parsed
		 *			and the collection reset with the new data.
		 *		@rejected with the jqXHR object if the fetch failed. The collection is cleared.
		 */
		fetch: function(boundingBox) {
			var self = this;
			var sitesDeferred = $.Deferred();

			this.url = 'waterService/?format=rdb&bBox=' +
				boundingBox.west.toFixed(6) + ',' +
				boundingBox.south.toFixed(6) + ',' +
				boundingBox.east.toFixed(6) + ',' +
				boundingBox.north.toFixed(6) +
				'&outputDataTypeCd=iv,dv&hasDataTypeCd=iv,dv&siteType=OC,LK,ST,SP,AS,AT';

			$.when(this.pCodePromise, this.sCodePromise).done(function() {
				$.ajax({
					type: "GET",
					url: self.url,
					dataType: 'text',
					success: function(data, textStatus, jqXHR){
						var lines = data.split("\n");
						var importantColumns = {
							"site_no" : null,
							"station_nm" : null,
							"dec_lat_va" : null,
							"dec_long_va" : null,
							"parm_cd" : null,
							"stat_cd" : null,
							"loc_web_ds" : null,
							"begin_date" : null,
							"end_date" : null,
							"count_nu" : null
						};
						var parsedSites = rdbUtils.parseRDB(lines, importantColumns);
						// Group the parse site information by site id
						var siteDataBySiteNo = _.groupBy(parsedSites, function(site) {
							return site.site_no;
						});

						var parseVariables = function(rawVariables) {
							var parseVariable = function(variable) {
								var name = '';
								var pName, sName;
								var statCd = variable.stat_cd;

								if ((self.parameterCodes) && (variable.parm_cd)) {
									pName = self.parameterCodes[variable.parm_cd];
									name = (pName ? pName : "PCode " + variable.parm_cd);
									name += ((variable.loc_web_ds) ?" (" + variable.loc_web_ds + ")" : "");
								}
								else {
									name = 'Unknown parameter ' + variable.parm_cd;
								}
								if (self.statisticCodes) {
									if (statCd) {
										sName = self.statisticCodes[statCd];
										name += " Daily " + (sName ? sName : statCd);
									}
									else {
										name += " Instantaneous";
										statCd = "00000";
									}
								}
								else {
									name += ' ' + statCd;
								}

								return {
									name : name,
									parameterCd : variable.parm_cd,
									statCd : statCd,
									startDate : moment(variable.begin_date, DATE_FORMAT),
									endDate : moment(variable.end_date, DATE_FORMAT),
									count : variable.count_nu
								};
							};
							return _.map(rawVariables, parseVariable);
						};

						var sites = _.map(siteDataBySiteNo, function(siteParameterData) {
							var variables = parseVariables(siteParameterData);

							var startDates = _.pluck(variables, 'startDate');
							var endDates = _.pluck(variables, 'endDate');

							var result= {
								siteNo : siteParameterData[0].site_no,
								name : siteParameterData[0].station_nm,
								lat : siteParameterData[0].dec_lat_va,
								lon : siteParameterData[0].dec_long_va,
								startDate : moment.min(startDates),
								endDate : moment.max(endDates),
								variables : new Backbone.Collection(variables)
							};
							return result;
						});

						self.reset(sites);

						log.debug('Fetched sites ' + self.length);
						sitesDeferred.resolve(jqXHR);
					},
					error: function(jqXHR, textStatus, errorThrown) {
						if (404 === jqXHR.status) {
							log.debug('No NWIS data available: ' + textStatus);
							self.reset([]);
							sitesDeferred.resolve(jqXHR);
						} else {
							log.debug('Error in loading NWIS data: ' + textStatus);
							self.reset([]);
							sitesDeferred.reject(jqXHR);
						}
					}
				});
			});
			return sitesDeferred.promise();
		},

		/*
		 * @returns {Boolean} if any of the nwis sites in the collection have variables that have
		 * the selected property set to true.
		 */
		hasSelectedVariables : function() {
			var isSelected = function(variableModel) {
				return variableModel.has('selected') && variableModel.get('selected');
			};
			return this.some(function(model) {
				return model.has('variables') && model.get('variables').some(isSelected);
			});

		},

		/*
		 * Retrieves the parameter codes and set the parameterCodes property on the collection. If
		 * the fetch fails the parameterCodes property is assigned undefined.
		 * @returns promise which is resolved when the fetch finishes, regardless of whether it was successful or not.
		 */
		getParameterCodes : function() {
			var self = this;
			var deferred = $.Deferred();
			$.ajax({
				type : "GET",
				url : parameterCodesPath + 'pmcodes?radio_pm_search=param_group&pm_group=Physical&format=rdb&show=parameter_nm',
				dataType: 'text',
				success: function(data) {
					var parsedParams = [];
					var lines = data.split("\n");
					var columns = {
						"parameter_cd" : null,
						"parameter_nm" : null
					};

					self.parameterCodes = {};
					parsedParams = rdbUtils.parseRDB(lines, columns);
					_.each(parsedParams, function(el, index) {
						self.parameterCodes[el.parameter_cd] = el.parameter_nm;
					});
					log.debug('Fetched parameter codes ' + _.size(self.parameterCodes));
					deferred.resolve();
				},
				error : function(jqXHR, textStatus, error) {
					log.debug('Error in loading NWIS Parameter definitions: ' + textStatus);
					self.parameterCodes = undefined;
					deferred.resolve();
				}
			});
			return deferred.promise();
		},

		/*
		 * Retrieves the statistic codes and set the statisticCodes property on the collection. If
		 * the fetch fails the statisticsCodes property is assigned undefined.
		 * @returns promise which is resolved when the fetch finishes, regardless of whether it was successful or not.
		 */
		getStatisticCodes : function() {
			var self = this;
			var deferred = $.Deferred();
			$.ajax({
				type : "GET",
				url : 'stcodes?read_file=stat&format=rdb',
				dataType: 'text',
				success: function(data) {
					var parsedStats = [];
					var lines = data.split("\n");
					var columns = {
						stat_CD : null,
						stat_NM : null,
						stat_DS : null
					};

					self.statisticCodes = {};
					parsedStats = rdbUtils.parseRDB(lines, columns);
					_.each(parsedStats, function(el) {
						self.statisticCodes[el.stat_CD] = rdbUtils.toTitleCase(el.stat_NM);
					});
					log.debug('Fetched statistic codes ' + _.size(self.statisticCodes));
					deferred.resolve();
				},
				error : function(jqXHR, textStatus, error) {
					self.statisticCodes = undefined;
					log.debug('Error in loading NWIS stat definitions: ' + textStatus);
					deferred.resolve();
				}
			});
			return deferred.promise();
		}

	});

	return collection;
});