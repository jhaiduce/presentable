(function(window, document) {
var html = function () {
        return {
            HASH_STRING: '',
            init: function (options) {
                this.HASH_STRING = options.urlHash;
                this.HIDE_NO_TITLE = options.hideNoTitle;
                this.NO_TITLE_TEXT = options.noTitle;
            },
            createRecursive: function (listParent, tocArray) {
                var ol, li, url, i;
                ol = document.createElement('ol');
                listParent.appendChild(ol);
                for (i = 0; i < tocArray.length; i++) {
                    if (this.HIDE_NO_TITLE && tocArray[i].title === this.NO_TITLE_TEXT) {
                        continue;
                    }
                    li = document.createElement('li');
                    url = this.HASH_STRING + tocArray[i].index;
                    li.innerHTML = '<div><a class="title" href="' + url + '">' + tocArray[i].title + '</a> <a class="index" href="' + url + '" >' + tocArray[i].index + '</a></div>';
                    ol.appendChild(li);
                    if (tocArray[i].nested) {
                        this.createRecursive(li, tocArray[i].nested);
                    }
                }
                return listParent;
            }
        };
    }();
var util = function () {
        return {
            querySelectorChild: function (parentElement, childSelector) {
                var tempId, child;
                if (!parentElement.id) {
                    tempId = 'tempId_' + Math.floor(Math.random() * 1000 * new Date().getUTCMilliseconds());
                    parentElement.id = tempId;
                }
                child = parentElement.querySelector('#' + parentElement.id + ' > ' + childSelector);
                if (tempId) {
                    parentElement.removeAttribute('id');
                }
                return child;
            },
            extend: function (a, b) {
                var i;
                for (i in b) {
                    if (b.hasOwnProperty(i)) {
                        a[i] = b[i];
                    }
                }
            }
        };
    }();
var json = function (util) {
        var json = {};
        json = {
            TITLE_SEARCH_STRING: '',
            UNTITLED_SLIDE_TEXT: '',
            TOC_CONTAINER: '',
            init: function (options) {
                this.TITLE_SEARCH_STRING = options.titles;
                this.UNTITLED_SLIDE_TEXT = options.noTitle;
                this.TOC_CONTAINER = options.tocContainer;
            },
            slideTitle: function (slide) {
                var titleElement = slide.querySelector(this.TITLE_SEARCH_STRING);
                if (titleElement) {
                    return titleElement.textContent.replace(/</g, '&lt;');
                } else {
                    return this.UNTITLED_SLIDE_TEXT;
                }
            },
            isTocSlide: function (slide) {
                return slide.querySelector(this.TOC_CONTAINER);
            },
            create: function () {
                var slides, slideCount, slideData, tocArray, i;
                slides = document.querySelectorAll(this.SLIDE_SEARCH_STRING);
                tocArray = [];
                slideCount = slides.length;
                for (i = 0; i < slideCount; i++) {
                    slideData = {};
                    slideData.index = this.slideIndex(slides[i], i);
                    slideData.title = this.slideTitle(slides[i]);
                    if (this.isTocSlide(slides[i])) {
                        slideData.toc = 'true';
                    }
                    tocArray.push(slideData);
                }
                return tocArray;
            }
        };
        json.frameworks = {};
        json.frameworks.revealjs = {
            SLIDE_SEARCH_STRING: '.slides > section',
            options: { urlHash: '#/' },
            create: function () {
                var sections, sectionCount, tocArray, i;
                sections = document.querySelectorAll(this.SLIDE_SEARCH_STRING);
                tocArray = [];
                sectionCount = sections.length;
                for (i = 0; i < sectionCount; i++) {
                    this.processSectionRecursive(i, sections[i], tocArray);
                }
                this.removeNestedDuplicatesByTitles(tocArray);
                this.removeUntitledFirstChild(tocArray);
                return tocArray;
            },
            isTocSlide: function (slide) {
                return util.querySelectorChild(slide, this.TOC_CONTAINER);
            },
            processSectionRecursive: function (slideIndex, slide, tocArray) {
                var slideData, sectionCount, i;
                slideData = {};
                slideData.index = slideIndex;
                slideData.title = this.slideTitleRecursive(slide);
                if (this.isTocSlide(slide)) {
                    slideData.toc = 'true';
                }
                tocArray.push(slideData);
                var childSections = slide.querySelectorAll('section');
                if (childSections.length === 0) {
                    return;
                }
                slideData.nested = [];
                sectionCount = childSections.length;
                for (i = 0; i < sectionCount; i++) {
                    this.processSectionRecursive(slideIndex + '/' + i, childSections[i], slideData.nested);
                }
            },
            slideTitleRecursive: function (slide) {
                var firstTitle, childSlide;
                firstTitle = slide.querySelector(this.TITLE_SEARCH_STRING);
                if (firstTitle && firstTitle.parentNode === slide) {
                    return firstTitle.textContent;
                }
                childSlide = slide.querySelector('section');
                if (childSlide) {
                    return this.slideTitleRecursive(childSlide);
                }
                return this.UNTITLED_SLIDE_TEXT;
            },
            removeNestedDuplicatesByTitles: function (tocArray) {
                var i, parentSlide, firstChildSlide;
                for (i = 0; i < tocArray.length; i++) {
                    parentSlide = tocArray[i];
                    if (!parentSlide.nested) {
                        continue;
                    }
                    firstChildSlide = parentSlide.nested[0];
                    if (parentSlide.title === firstChildSlide.title && firstChildSlide.title !== this.UNTITLED_SLIDE_TEXT) {
                        if (parentSlide.nested.length < 2) {
                            delete parentSlide.nested;
                        } else {
                            parentSlide.nested.shift();
                        }
                    }
                }
            },
            removeUntitledFirstChild: function (tocArray) {
                var i, parentSlide, firstChildSlide;
                for (i = 0; i < tocArray.length; i++) {
                    parentSlide = tocArray[i];
                    if (!parentSlide.nested) {
                        continue;
                    }
                    firstChildSlide = parentSlide.nested[0];
                    if (firstChildSlide.title === this.UNTITLED_SLIDE_TEXT) {
                        parentSlide.nested.shift();
                    }
                }
            }
        };
        json.frameworks.html5slides = {
            SLIDE_SEARCH_STRING: 'article',
            options: { reload: true },
            slideIndex: function (slide, i) {
                return i + 1;
            }
        };
        json.frameworks.io2012slides = {
            SLIDE_SEARCH_STRING: 'slide:not([hidden=""])',
            options: { reload: true },
            slideIndex: function (slide, i) {
                return i + 1;
            }
        };
        json.frameworks.shower = {
            SLIDE_SEARCH_STRING: '.slide',
            slideIndex: function (slide) {
                return slide.id;
            }
        };
        json.frameworks.impressjs = {
            SLIDE_SEARCH_STRING: '.step',
            slideIndex: function (slide, i) {
                if (slide.id) {
                    return slide.id;
                }
                return 'step-' + (i + 1);
            }
        };
        return json;
    }(util);
var controller = function (html, json, util) {
        var log = this.console ? console.log.bind(console) : function () {
            }, main = {
                options: {
                    data: { 'slides': [] },
                    framework: '',
                    iconContainer: '#presentable-icon',
                    keyCode: 84,
                    noTitle: 'Untitled Slide',
                    hideNoTitle: false,
                    reload: false,
                    titles: 'h1,h2,h3,.presentable-title',
                    tocContainer: '#presentable-toc',
                    urlHash: '#'
                },
                init: function (userOptions) {
                    var tocSlideData, toc, tocContainer, iconContainer;
                    try {
                        main.configure(userOptions);
                        if (main.options.data.slides.length === 0) {
                            util.extend(json, json.frameworks[main.options.framework]);
                            json.init(main.options);
                            main.options.data.slides = json.create();
                        }
                        tocSlideData = main.tocSlideDataRecursive(main.options.data.slides);
                        if (!tocSlideData) {
                            throw new Error('Table of Contents container not found in presentation.');
                        }
                        tocContainer = document.querySelector(main.options.tocContainer);
                        iconContainer = document.querySelector(main.options.iconContainer);
                        html.init(main.options);
                        toc = html.createRecursive(document.createDocumentFragment(), main.options.data.slides);
                        if (main.options.keyCode !== false) {
                            main.enableKeyboardNavigation(tocSlideData);
                        }
                        if (iconContainer) {
                            main.enableOnClickNavigation(iconContainer);
                        }
                        main.enableOnClickNavigation(tocContainer);
                        tocContainer.appendChild(toc);
                    } catch (e) {
                        log('Presentable: ' + e.message);
                    }
                },
                configure: function (userOptions) {
                    if (userOptions.framework) {
                        util.extend(main.options, json.frameworks[userOptions.framework].options);
                        util.extend(main.options, userOptions);
                    } else if (userOptions.data) {
                        util.extend(main.options, userOptions);
                    } else {
                        throw { message: 'You must provide a value for framework or data.' };
                    }
                },
                enableOnClickNavigation: function (container) {
                    container.addEventListener('click', function (event) {
                        var target;
                        event.stopPropagation();
                        event.preventDefault();
                        target = event.target;
                        while (container !== target) {
                            if (target.href && target.tagName === 'A') {
                                main.goToSlide(target.href);
                                break;
                            }
                            target = target.parentNode;
                        }
                    }, false);
                },
                enableKeyboardNavigation: function (tocSlideData) {
                    window.document.body.addEventListener('keyup', function (event) {
                        var keyPressed;
                        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.altKey || event.ctrlKey || event.metaKey) {
                            return;
                        }
                        event.preventDefault();
                        keyPressed = event.keyCode || event.which;
                        if (keyPressed === main.options.keyCode) {
                            main.goToSlide(main.options.urlHash + tocSlideData.index);
                        }
                    }, false);
                },
                tocSlideDataRecursive: function (tocArray) {
                    for (var i = 0; i < tocArray.length; i++) {
                        if (tocArray[i].toc) {
                            return tocArray[i];
                        }
                        if (tocArray[i].nested) {
                            var tocData = main.tocSlideDataRecursive(tocArray[i].nested);
                            if (tocData) {
                                return tocData;
                            }
                        }
                    }
                },
                slideTitlesRecursive: function (index, tocArray, title) {
                    title = title || '';
                    tocArray = tocArray || main.options.data.slides;
                    for (var i = 0; i < tocArray.length; i++) {
                        if (tocArray[i].index === index) {
                            title = tocArray[i].title;
                        }
                        if (tocArray[i].nested) {
                            title = main.slideTitlesRecursive(index, tocArray[i].nested, title);
                        }
                    }
                    return title;
                },
                goToSlide: function (URL) {
                    window.location = URL;
                    if (main.options.reload) {
                        window.location.reload();
                    }
                }
            };
        return {
            toc: main.init,
            slideTitle: main.slideTitlesRecursive
        };
    }(html, json, util);
(function (controller) {
    if (typeof define === 'function' && define.amd) {
        window.define(function () {
            return controller;
        });
    } else {
        window.presentable = controller;
    }
}(controller));}(window, document) );