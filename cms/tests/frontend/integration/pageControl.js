'use strict';

// #############################################################################
// Users managed via the admin panel

var globals = require('./settings/globals');
var randomString = require('./helpers/randomString').randomString;
var casperjs = require('casper');
var cms = require('./helpers/cms')(casperjs);
var xPath = casperjs.selectXPath;

var SECOND_PAGE_TITLE = 'Second';
var UPDATED_TITLE = 'updated'; // shouldn't match "Second"
var pageUrl = (globals.baseUrl + SECOND_PAGE_TITLE).toLowerCase() + '/';

casper.test.setUp(function (done) {
    casper.start()
        .then(cms.login())
        .then(cms.addPage({ title: 'First page' }))
        // adding second one because first is published by default
        .then(cms.addPage({ title: SECOND_PAGE_TITLE }))
        .run(done);
});

casper.test.tearDown(function (done) {
    casper.start()
        .then(cms.removePage({ title: SECOND_PAGE_TITLE }))
        .then(cms.removePage({ title: 'First page' })) // removing both pages
        .then(cms.logout())
        .run(done);
});

0 && casper.test.begin('Page settings are accessible and can be edited from modal', function (test) {
    casper
        .start(globals.editUrl)
        // wait till toolbar is visible
        .waitUntilVisible('.cms-toolbar-expanded')
        .then(function () {
            this.thenOpen(pageUrl);
        })
        .then(function () {
            test.assertTitleMatch(
                new RegExp(SECOND_PAGE_TITLE),
                'Current page is the correct one'
            );
        })
        .then(function () {
            // click on "Page" menu item
            this.click('.cms-toolbar-item-navigation > li:nth-child(2) > a');
        })
        // opening "Page settings" menu item
        .waitForSelector('.cms-toolbar-item-navigation-hover', function () {
            this.click(
                xPath('//a[.//span[text()[contains(.,"Page settings")]]]')
            );
        })

        // switch to Page settings modal
        .withFrame(0, function () {
            // wait until form is loaded
            casper.waitUntilVisible('#page_form', function () {
                test.assertField(
                    'title',
                    SECOND_PAGE_TITLE,
                    'Page settings modal available'
                );
            }).then(function () {
                this.fill('#page_form', {
                    title: UPDATED_TITLE
                }, false);
            });
        })
        .then(function () {
            // submit the form without closing the modal
            this.click(
                xPath('//a[contains(@class, "cms-btn")][text()[contains(.,"Save and continue editing")]]')
            );
        })
        // expect success message to appear
        .waitUntilVisible('.cms-messages-inner', function () {
            test.assertSelectorHasText(
                '.cms-messages-inner',
                'The page "' + SECOND_PAGE_TITLE + '" was changed successfully. You may edit it again below.',
                'Page settings can be edited through modal'
            );
        })
        // switch to modal again
        .withFrame(0, function () {
            casper.waitUntilVisible('#page_form', function () {
                test.assertField(
                    'title',
                    UPDATED_TITLE,
                    'Title was updated'
                );
            });
        })
        // reload the page and check that new title was applied
        .then(function () {
            this.reload();
        })
        .then(function () {
            test.assertTitleMatch(
                new RegExp(UPDATED_TITLE),
                'Current page has correct title'
            );
        })

        .run(function () {
            test.done();
        });
});

0 && casper.test.begin('Page advanced settings are accessible from modal and can be edited', function (test) {
    var random = randomString();
    casper
        .start(globals.editUrl)
        // wait till toolbar is visible
        .waitUntilVisible('.cms-toolbar-expanded')
        .then(function () {
            this.thenOpen(pageUrl);
        })
        .then(function () {
            // click on "Page" menu item
            this.click('.cms-toolbar-item-navigation > li:nth-child(2) > a');
        })
        // opening "Page settings" menu item
        .waitForSelector('.cms-toolbar-item-navigation-hover', function () {
            this.click(
                xPath('//a[.//span[text()[contains(.,"Page settings")]]]')
            );
        })

        // switch to Page settings modal
        .withFrame(0, function () {
            // wait until form is loaded
            casper.waitUntilVisible('#page_form', function () {
                test.assertField(
                    'title',
                    SECOND_PAGE_TITLE,
                    'Page settings modal available'
                );
            });
        })

        // switch to "Advanced settings"
        .then(function () {
            this.click(
                xPath('//a[contains(@class, "cms-btn")][text()[contains(.,"Advanced Settings")]]')
            );
        })

        // then with modal
        .withFrame(0, function () {
            casper.waitUntilVisible('#page_form', function () {
                test.assertField(
                   'overwrite_url',
                   '',
                   'Advanced settings are available from modal'
                );
            })
            .then(function () {
                this.fill('#page_form', {
                    overwrite_url: '/overwritten-url-' + random
                }, false);
            });
        })

        // submit the advanced settings form
        .then(function () {
            this.click('.cms-modal-item-buttons .cms-btn-action');
        })

        // wait until we are redirected to updated page
        .waitForUrl(/overwritten-url/, function () {
            test.assertUrlMatch(/overwritten-url/, 'Url have been overwritten');
            test.assertTitleMatch(new RegExp(SECOND_PAGE_TITLE), 'Title is still the same');
        })

        .then(function () {
            // click on "Page" menu item
            this.click('.cms-toolbar-item-navigation > li:nth-child(2) > a');
        })
        // opening "Page settings" menu item
        .waitForSelector('.cms-toolbar-item-navigation-hover', function () {
            this.click(
                xPath('//a[.//span[text()[contains(.,"Advanced settings")]]]')
            );
        })

        // then with modal
        .withFrame(0, function () {
            casper.waitUntilVisible('#page_form', function () {
                test.assertField(
                   'overwrite_url',
                   'overwritten-url-' + random,
                   'Advanced settings are available from modal'
                );
            }).then(function () {
                this.fill('#page_form', {
                    overwrite_url: ''
                }, false);
            });
        })
        // submit the advanced settings form
        .then(function () {
            this.click('.cms-modal-item-buttons .cms-btn-action');
        })

        // wait until we are redirected to updated page
        .waitForUrl(new RegExp(SECOND_PAGE_TITLE.toLowerCase()))

        // check that the page was edited correctly
        .then(function () {
            test.assertUrlMatch(new RegExp(SECOND_PAGE_TITLE.toLowerCase()), 'Url have been overwritten');
            test.assertTitleMatch(new RegExp(SECOND_PAGE_TITLE), 'Title is still the same');
        })

        .run(function () {
            test.done();
        });
});

casper.test.begin('Page can be deleted', function (test) {
    casper
        .start(globals.editUrl)
        // wait till toolbar is visible
        .waitUntilVisible('.cms-toolbar-expanded')
        .then(function () {
            this.thenOpen(pageUrl);
        })
        .then(function () {
            // click on "Page" menu item
            this.click('.cms-toolbar-item-navigation > li:nth-child(2) > a');
        })
        // opening "Page settings" menu item
        .waitForSelector('.cms-toolbar-item-navigation-hover', function () {
            this.click(
                xPath('//a[.//span[text()[contains(.,"Delete page")]]]')
            );
        })
        // wait for modal window appearance and submit page deletion
        .waitUntilVisible('.cms-modal-open', function () {
            test.assertVisible('.cms-modal-open');
            this.click('.cms-modal-buttons .deletelink');
        })

        // check that we were redirected to the root
        .then(function () {
            test.assertUrlMatch(/en\//, 'Page was removed and user was redirected');
            test.assertTitleMatch(/First page/, 'Title is still the same');
        })

        // try to open the page that we deleted
        .thenOpen(pageUrl)
        .then(function () {
            test.assertTitleMatch(/Page not found/, 'The page is not available');
        })

        // have to add the page back so tearDown runs correctly
        .then(cms.addPage({ title: SECOND_PAGE_TITLE }))
        .run(function () {
            test.done();
        });
});
