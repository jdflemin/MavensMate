/**
 * @file Runs apex unit tests/opens the test runner UI
 * @author Joseph Ferraro <@joeferraro>
 */

'use strict';

var _               = require('lodash');
var Promise         = require('bluebird');
var util            = require('../../util');
var inherits        = require('inherits');
var BaseCommand     = require('../../command');
var ApexTest        = require('../../services/test');
var EditorService   = require('../../services/editor');

function Command() {
  BaseCommand.call(this, arguments);
}

inherits(Command, BaseCommand);

Command.prototype.execute = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    if (self.isUICommand()) {
      var urlParams = { pid: self.getProject().id };
      if (self.payload && self.payload.classes && _.isArray(self.payload.classes)) {
        urlParams.className = [ self.payload.classes[0] ];
      }
      self.editorService.launchUI('test/new', urlParams)
        .then(function() {
          resolve('Success');
        })
        .catch(function(error) {
          reject(error);
        });
    } else {
      var test = new ApexTest(self.getProject(), self.payload.skipCoverage);
      var executePromise = self.payload.paths ? test.executeTestClasses(self.payload.paths) : test.executeTestMethods(self.payload.tests);
      executePromise
        .then(function(testResults) {
          if (self.payload.html) {
            resolve(test.getResultHtml(testResults));
          } else {
            resolve(testResults);
          }
        })
        .catch(function(error) {
          reject(error);
        })
        .done();
    }
  });
};

exports.command = Command;
exports.addSubCommand = function(program) {
  program
    .command('run-tests [testPath]')
    .alias('test')
    .option('--ui', 'Launches the Apex test runner UI.')
    .description('Runs Apex unit tests')
    .action(function(testPath){
      if (this.ui) {
        program.commandExecutor.execute({
          name: this._name,
          body: { args: { ui: true } },
          editor: this.parent.editor
        });
      } else {
        var self = this;
        if (testPath) {
          var payload = { tests : [ testPath ] };
          program.commandExecutor.execute({
            name: self._name,
            body: payload,
            editor: self.parent.editor
          });
        } else {
          util.getPayload()
            .then(function(payload) {
              program.commandExecutor.execute({
                name: self._name,
                body: payload,
                editor: self.parent.editor
              });
            });
        }
      }
    });
};