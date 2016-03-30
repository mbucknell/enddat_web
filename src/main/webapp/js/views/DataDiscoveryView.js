/* jslint browser: true */

define([
	'loglevel',
	'underscore',
	'views/BaseView',
	'views/NavView',
	'views/AlertView',
	'views/MapView',
	'views/LocationView',
	'views/ChooseView',
	'hbs!hb_templates/dataDiscovery'
], function (log, _, BaseView, NavView, AlertView, MapView, LocationView, ChooseView, hbTemplate) {
	"use strict";

	var NAVVIEW_SELECTOR = '.workflow-nav';
	var LOCATION_SELECTOR = '.location-panel';
	var CHOOSE_SELECTOR = '.choose-panel';
	var MAPVIEW_SELECTOR = '.map-container-div';
	var ALERTVIEW_SELECTOR = '.alert-container';
	var LOADING_SELECTOR = '.loading-indicator';

	var DATATYPE_NWIS = 'NWIS';
	var DATATYPE_PRECIP = 'PRECIP';
	var DATASETS = [DATATYPE_NWIS, DATATYPE_PRECIP];

	var view = BaseView.extend({
		template: hbTemplate,

		/*
		 * @constructs
		 * @param {Object} options
		 *		@prop {Jquery element} el
		 *		@prop {models/WorkflowStateModel} model
		 *		@prop {Backbone.Router} router
		 */
		initialize: function (options) {
			BaseView.prototype.initialize.apply(this, arguments);

			this.navView = new NavView({
				el : this.$(NAVVIEW_SELECTOR),
				model : this.model,
				router : this.router
			});

			this.alertView = new AlertView({
				el : this.$(ALERTVIEW_SELECTOR)
			});

			this.mapView = new MapView({
				el : this.$(MAPVIEW_SELECTOR),
				mapDivId : 'map-div',
				model : this.model			});

			this.locationView  = new LocationView({
				el : this.$(LOCATION_SELECTOR),
				model : this.model,
				opened : true
			});

			this.chooseView  = new ChooseView({
				el : this.$(CHOOSE_SELECTOR),
				model : this.model,
				opened : true
			});

			// Set up event listeners on the workflow model
			this.listenTo(this.model, 'dataset:updateStart', this.showLoadingIndicator);
			this.listenTo(this.model, 'dataset:updateFinished', this.hideLoadingIndicator);
			this.listenTo(this.model, 'change:step', this.updateChooseView);

		},

		render : function() {
			var step = this.model.get('step');

			BaseView.prototype.render.apply(this, arguments);

			this.$(LOADING_SELECTOR).hide();
			this.alertView.setElement(this.$(ALERTVIEW_SELECTOR));

			//Don't fetch datasets until the view has been rendered
			this.model.updateDatasetModels();

			this.navView.setElement(this.$(NAVVIEW_SELECTOR)).render();
			if ((this.model.PROJ_LOC_STEP === step) || (this.model.CHOOSE_DATA_STEP === step)) {
				this.locationView.setElement(this.$(LOCATION_SELECTOR)).render();
				this.mapView.setElement(this.$(MAPVIEW_SELECTOR)).render();
			}

			this.updateChooseView();
			return this;
		},

		remove: function () {
			this.navView.remove();
			this.alertView.remove();
			this.mapView.remove();
			this.locationView.remove();
			this.chooseView.remove();
			BaseView.prototype.remove.apply(this, arguments);
			return this;
		},

		/*
		 * Model event handlers
		 */

		showLoadingIndicator : function() {
			this.$(LOADING_SELECTOR).show();
		},

		hideLoadingIndicator : function(fetchErrorTypes) {
			var chosenDatasets = this.model.get('datasets');

			this.$(LOADING_SELECTOR).hide();
			if (fetchErrorTypes.length === 0) {
				this.alertView.showSuccessAlert('Successfully fetch data of type(s): ' + chosenDatasets.join(', '));
			}
			else {
				this.alertView.showDangerAlert('Unable to fetch the following data types: ' + fetchErrorTypes.join(', '));
			}
			this.$(ALERTVIEW_SELECTOR).show();
		},

		updateChooseView: function () {
			var step = this.model.get('step');
			if (this.model.CHOOSE_DATA_STEP === step) {
				this.chooseView.setElement(this.$(CHOOSE_SELECTOR)).render();
				this.$(CHOOSE_SELECTOR).show();
			}
			else if (this.model.PROJ_LOC_STEP === step ) {
				this.$(CHOOSE_SELECTOR).hide();
				this.$(ALERTVIEW_SELECTOR).hide();
			}
			return this;
		}

	});

	return view;
});
