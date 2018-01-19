(function () {
	'use strict';

	var GitBranchFromClipboard = function() {
		this.selectedText = undefined;
		this.options = {
			prefix: undefined,
			command: undefined,
			replacement: undefined
		};

		this.restoreOptions();
		this.eventHandlers();
		this.initialize();
	}

	GitBranchFromClipboard.prototype.restoreOptions = function() {
		var self = this;

		// Use default value color = 'red' and likesColor = true.
		chrome.storage.sync.get(
			{
				prefix: 'feature/',
				command: 'git checkout -b ',
				replacement: '-'
			},
			function(items) {
				self.options.prefix = items.prefix;
				self.options.command = items.command;
				self.options.replacement = items.replacement;
			}
		);
	}

	GitBranchFromClipboard.prototype.eventHandlers = function() {
		var self = this;
		var $body = document.getElementsByTagName('body')[0],
			$btnMenu = document.getElementById('btn-menu'),
			$menu = document.getElementById('menu'),
			$btnHelp = document.getElementById('help'),
			$btnSettings = document.getElementById('settings'),
			$btnClose = document.getElementById('close'),
			$form = document.getElementById('form');

		$form.addEventListener('submit', function(event) {
			event.preventDefault();
			self.getFieldValue();
		});

		$body.addEventListener('click', function(event) {
			$menu.dataset.menu = 'closed';
		});

		$btnMenu.addEventListener('click', function(event) {
			event.stopPropagation();
			$menu.dataset.menu = 'open';
		});

		$btnHelp.addEventListener('click', function() {
			$body.dataset.help = 'open';
		});

		$btnClose.addEventListener('click', function() {
			$body.dataset.help = 'closed';
		});

		$btnSettings.addEventListener('click', function() {
			chrome.runtime.openOptionsPage();
		});
	}

	GitBranchFromClipboard.prototype.initialize = function() {
		var self = this;
		var parsedText = undefined;

		chrome.tabs.executeScript(
			{
				code: "window.getSelection().toString();"
			},
			function(selection) {
				self.selectedText = selection[0];

				if (self.selectedText) {
					self.showResult(self.selectedText);
				}
				else {
					self.getTabTitle();
				}
			}
		);
	};

	GitBranchFromClipboard.prototype.setInputValue = function(inputId, value) {
		var input = document.getElementById(inputId);

		if (input === null) {
			return;
		}

		input.value = value;
	}

	GitBranchFromClipboard.prototype.getTabTitle = function() {
		var self = this;
		var tabTitle = undefined,
			parsedText = undefined;

		chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
			if (tabs.length > 1) {
				console.log('[Extension--GitBranchFromClipboard] Query unexpectedly returned more than 1 tab.');
			}
			else {
				tabTitle = tabs[0].title;

				self.showResult(tabTitle);
			}
		});
	}

	GitBranchFromClipboard.prototype.getFieldValue = function() {
		var self = this;
		var fieldValue = undefined,
			parsedText = undefined,
			$field = document.getElementById('name');

		if ($field.value) {
			fieldValue = $field.value;

			self.showResult( fieldValue );
		}
	}

	GitBranchFromClipboard.prototype.showResult = function(text) {
		var self = this;
		var parsedText = self.parseText(text);

		self.copyToClipboard( parsedText );
		self.setInputValue('result', parsedText);
		self.setInputValue('name', text);
	}

	GitBranchFromClipboard.prototype.parseText = function(text) {
		var self = this;
		var regexEdgeSymbols = /^[^a-zA-Z0-9]+|([^a-zA-Z0-9]+)$/g,
			regexMiddleSymbols = /[^a-zA-Z0-9]+/g,
			prefix = self.options.prefix,
			gitCommand = self.options.command,
			replacementText = self.options.replacement,
			titleEnclosure = "\"",
			regexBrand = /jira$|trello$/i;

		text = text
			.replace(regexBrand, '')
			.replace(regexEdgeSymbols, '')
			.replace(regexMiddleSymbols, replacementText);
		text = gitCommand + titleEnclosure + prefix + text + titleEnclosure;

		return text;
	};

	GitBranchFromClipboard.prototype.copyToClipboard = function(text) {
		var utils = window.ExtUtils;
		var textArea = document.createElement('textarea');

		textArea.id = 'text-copier';
		textArea.value = text;

		document.body.appendChild(textArea);

		textArea.select();

		try {
			var successful = document.execCommand('copy');
			utils.toastMessage( chrome.i18n.getMessage('txtSuccess') );
		} catch (err) {
			utils.toastMessage( chrome.i18n.getMessage('txtFailed'), 'error' );
		}

		document.body.removeChild(textArea);
	};

	if (window.GitBranchFromClipboard === undefined) {
		window.GitBranchFromClipboard = new GitBranchFromClipboard();
	}
})();
