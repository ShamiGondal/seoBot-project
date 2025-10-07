const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { updateTrafficDataRank, updateTrafficDataHits, updateTrafficDataWithSEO, storeWebsiteMetadata } = require('./helpers/dbHelpers');

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// DuckDuckGo configuration
const DUCKDUCKGO_CONFIG = {
    name: 'DuckDuckGo',
    homepageUrl: 'https://duckduckgo.com',
    searchBarSelector: 'input[name="q"], #search_form_input_homepage, #search_form_input',
    resultSelector: '[data-testid="result-title-a"], .result__url, .result__a, h2 a',
    nextButtonSelector: '.result--more__btn',
    resultContainer: '[data-testid="result"], .result'
};

// Helper function to get DuckDuckGo configuration
const getDuckDuckGoConfig = () => {
    return { key: 'duckduckgo', config: DUCKDUCKGO_CONFIG };
};

// Comprehensive SEO Metadata Extraction Function
const extractSEOMetadata = async (page, url) => {
    try {
        console.log(`🔍 Starting comprehensive SEO metadata extraction for: ${url}`);
        
        const startTime = Date.now();
        
        // Extract all SEO metadata using page.evaluate
        const metadata = await page.evaluate(() => {
            const getMetaContent = (name) => {
                const meta = document.querySelector(`meta[name="${name}"]`) || 
                           document.querySelector(`meta[property="${name}"]`);
                return meta ? meta.getAttribute('content') : '';
            };
            
            const getOpenGraphContent = (property) => {
                const meta = document.querySelector(`meta[property="og:${property}"]`);
                return meta ? meta.getAttribute('content') : '';
            };
            
            const getTwitterContent = (name) => {
                const meta = document.querySelector(`meta[name="twitter:${name}"]`);
                return meta ? meta.getAttribute('content') : '';
            };
            
            // Basic Meta Tags
            const metaTags = {
                title: document.title || '',
                description: getMetaContent('description'),
                keywords: getMetaContent('keywords'),
                author: getMetaContent('author'),
                viewport: getMetaContent('viewport'),
                charset: document.characterSet || '',
                language: document.documentElement.lang || '',
                canonical: document.querySelector('link[rel="canonical"]')?.href || '',
                robots: getMetaContent('robots'),
                refresh: getMetaContent('refresh')
            };
            
            // Open Graph Tags
            const openGraph = {
                title: getOpenGraphContent('title'),
                description: getOpenGraphContent('description'),
                image: getOpenGraphContent('image'),
                url: getOpenGraphContent('url'),
                type: getOpenGraphContent('type'),
                siteName: getOpenGraphContent('site_name'),
                locale: getOpenGraphContent('locale')
            };
            
            // Twitter Card Tags
            const twitterCard = {
                card: getTwitterContent('card'),
                title: getTwitterContent('title'),
                description: getTwitterContent('description'),
                image: getTwitterContent('image'),
                creator: getTwitterContent('creator'),
                site: getTwitterContent('site')
            };
            
            // Heading Structure
            const headings = {
                h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()).filter(t => t),
                h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim()).filter(t => t),
                h3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent.trim()).filter(t => t),
                h4: Array.from(document.querySelectorAll('h4')).map(h => h.textContent.trim()).filter(t => t),
                h5: Array.from(document.querySelectorAll('h5')).map(h => h.textContent.trim()).filter(t => t),
                h6: Array.from(document.querySelectorAll('h6')).map(h => h.textContent.trim()).filter(t => t)
            };
            
            // Content Analysis
            const bodyText = document.body.textContent || '';
            const wordCount = bodyText.split(/\s+/).filter(word => word.length > 0).length;
            const paragraphCount = document.querySelectorAll('p').length;
            const imageCount = document.querySelectorAll('img').length;
            const videoCount = document.querySelectorAll('video').length;
            
            // Links Analysis
            const allLinks = Array.from(document.querySelectorAll('a[href]'));
            const currentDomain = window.location.hostname;
            
            const internalLinks = allLinks.filter(link => {
                try {
                    const url = new URL(link.href, window.location.href);
                    return url.hostname === currentDomain;
                } catch (e) {
                    return false;
                }
            });
            
            const externalLinks = allLinks.filter(link => {
                try {
                    const url = new URL(link.href, window.location.href);
                    return url.hostname !== currentDomain && url.protocol.startsWith('http');
                } catch (e) {
                    return false;
                }
            });
            
            // Images Analysis
            const images = Array.from(document.querySelectorAll('img')).map(img => ({
                src: img.src || '',
                alt: img.alt || '',
                title: img.title || '',
                width: img.naturalWidth || 0,
                height: img.naturalHeight || 0,
                hasAlt: !!img.alt,
                isOptimized: !!(img.src && (img.src.includes('.webp') || img.src.includes('.avif')))
            }));
            
            // Links Analysis
            const links = {
                internal: internalLinks.map(link => ({
                    url: link.href,
                    text: link.textContent.trim(),
                    title: link.title || ''
                })),
                external: externalLinks.map(link => ({
                    url: link.href,
                    text: link.textContent.trim(),
                    title: link.title || '',
                    nofollow: link.rel.includes('nofollow')
                }))
            };
            
            // Schema Markup Detection
            const schemaScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
            const schemaTypes = schemaScripts.map(script => {
                try {
                    const data = JSON.parse(script.textContent);
                    return data['@type'] || 'Unknown';
                } catch (e) {
                    return 'Invalid';
                }
            });
            
            // Technical SEO Checks
            const technicalSEO = {
                hasSchema: schemaScripts.length > 0,
                schemaTypes: schemaTypes,
                sslEnabled: window.location.protocol === 'https:',
                mobileFriendly: !!document.querySelector('meta[name="viewport"]'),
                responsiveDesign: !!document.querySelector('meta[name="viewport"][content*="width=device-width"]')
            };
            
            // Content Analysis Summary
            const contentAnalysis = {
                wordCount,
                paragraphCount,
                imageCount,
                videoCount,
                internalLinks: internalLinks.length,
                externalLinks: externalLinks.length,
                brokenLinks: 0, // Would need to check each link
                duplicateContent: false // Would need more complex analysis
            };
            
            return {
                metaTags,
                openGraph,
                twitterCard,
                headings,
                contentAnalysis,
                technicalSEO,
                images,
                links,
                schemaTypes,
                pageSize: document.documentElement.outerHTML.length,
                loadTime: performance.now()
            };
        });
        
        const endTime = Date.now();
        const totalLoadTime = endTime - startTime;
        
        // Add performance metrics
        metadata.performance = {
            loadTime: totalLoadTime,
            domContentLoaded: await page.evaluate(() => performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart),
            firstContentfulPaint: await page.evaluate(() => {
                const paintEntries = performance.getEntriesByType('paint');
                const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
                return fcp ? fcp.startTime : 0;
            })
        };
        
        // Calculate SEO Score
        const seoScore = calculateSEOScore(metadata);
        metadata.seoScore = seoScore;
        
        // Analysis Status
        metadata.analysisStatus = {
            completed: true,
            errors: [],
            warnings: [],
            recommendations: generateSEORecommendations(metadata)
        };
        
        console.log(`✅ SEO metadata extraction completed in ${totalLoadTime}ms`);
        console.log(`📊 SEO Score: ${seoScore.overall}/100`);
        
        return metadata;
        
    } catch (error) {
        console.error(`❌ Error extracting SEO metadata: ${error.message}`);
        return null;
    }
};

// Calculate SEO Score based on extracted metadata
const calculateSEOScore = (metadata) => {
    let score = 0;
    let maxScore = 100;
    
    // Basic Meta Tags (20 points)
    if (metadata.metaTags.title) score += 5;
    if (metadata.metaTags.description) score += 5;
    if (metadata.metaTags.keywords) score += 3;
    if (metadata.metaTags.canonical) score += 2;
    if (metadata.metaTags.robots) score += 2;
    if (metadata.metaTags.viewport) score += 3;
    
    // Heading Structure (15 points)
    if (metadata.headings.h1.length > 0) score += 5;
    if (metadata.headings.h2.length > 0) score += 3;
    if (metadata.headings.h3.length > 0) score += 2;
    if (metadata.headings.h1.length === 1) score += 5; // Only one H1 is good
    
    // Open Graph (10 points)
    if (metadata.openGraph.title) score += 3;
    if (metadata.openGraph.description) score += 3;
    if (metadata.openGraph.image) score += 2;
    if (metadata.openGraph.url) score += 2;
    
    // Content Quality (20 points)
    if (metadata.contentAnalysis.wordCount > 300) score += 10;
    if (metadata.contentAnalysis.imageCount > 0) score += 5;
    if (metadata.contentAnalysis.internalLinks > 0) score += 5;
    
    // Technical SEO (15 points)
    if (metadata.technicalSEO.sslEnabled) score += 5;
    if (metadata.technicalSEO.mobileFriendly) score += 5;
    if (metadata.technicalSEO.hasSchema) score += 5;
    
    // Images (10 points)
    const imagesWithAlt = metadata.images.filter(img => img.hasAlt).length;
    const altPercentage = metadata.images.length > 0 ? (imagesWithAlt / metadata.images.length) * 100 : 0;
    score += Math.min(10, altPercentage / 10);
    
    // Performance (10 points)
    if (metadata.performance.loadTime < 2000) score += 5;
    if (metadata.performance.loadTime < 1000) score += 5;
    
    return {
        overall: Math.min(100, Math.max(0, score)),
        technical: Math.min(100, (metadata.technicalSEO.sslEnabled ? 50 : 0) + (metadata.technicalSEO.mobileFriendly ? 50 : 0)),
        content: Math.min(100, (metadata.contentAnalysis.wordCount > 300 ? 50 : 0) + (metadata.headings.h1.length > 0 ? 50 : 0)),
        onPage: Math.min(100, (metadata.metaTags.title ? 50 : 0) + (metadata.metaTags.description ? 50 : 0)),
        performance: Math.min(100, metadata.performance.loadTime < 2000 ? 100 : 50),
        accessibility: Math.min(100, altPercentage)
    };
};

// Generate SEO Recommendations
const generateSEORecommendations = (metadata) => {
    const recommendations = [];
    
    if (!metadata.metaTags.title) {
        recommendations.push('Add a title tag to improve SEO');
    }
    if (!metadata.metaTags.description) {
        recommendations.push('Add a meta description tag');
    }
    if (metadata.headings.h1.length === 0) {
        recommendations.push('Add at least one H1 tag');
    }
    if (metadata.headings.h1.length > 1) {
        recommendations.push('Use only one H1 tag per page');
    }
    if (metadata.contentAnalysis.wordCount < 300) {
        recommendations.push('Increase content length (minimum 300 words recommended)');
    }
    if (!metadata.technicalSEO.sslEnabled) {
        recommendations.push('Enable SSL certificate');
    }
    if (!metadata.technicalSEO.mobileFriendly) {
        recommendations.push('Add viewport meta tag for mobile responsiveness');
    }
    if (metadata.images.length > 0) {
        const imagesWithoutAlt = metadata.images.filter(img => !img.hasAlt).length;
        if (imagesWithoutAlt > 0) {
            recommendations.push(`Add alt text to ${imagesWithoutAlt} images`);
        }
    }
    if (metadata.performance.loadTime > 2000) {
        recommendations.push('Optimize page load time (currently > 2 seconds)');
    }
    
    return recommendations;
};

// Helper function for DuckDuckGo search
const duckDuckGoSearch = async (page, keyword, url, searchEngine, userId, country) => {
    try {
        console.log(`🏠 Visiting DuckDuckGo homepage...`);
        console.log(`🌐 Homepage URL: ${searchEngine.config.homepageUrl}`);
        
        try {
            await page.goto(searchEngine.config.homepageUrl, { 
                waitUntil: 'domcontentloaded', 
                timeout: 60000 
            });
            console.log(`✅ Successfully loaded DuckDuckGo page`);
        } catch (error) {
            console.error(`❌ Failed to load DuckDuckGo page: ${error.message}`);
            throw error;
        }
        
        // Wait for page to fully load
        console.log(`⏳ Waiting for page to fully load...`);
        await page.waitForTimeout(3000 + Math.random() * 2000);
        
        console.log(`🔍 Looking for search bar on DuckDuckGo page...`);
        
        // Try multiple selectors for DuckDuckGo search bar
        const searchBarSelectors = [
            'input[name="q"]',
            '#search_form_input_homepage',
            '#search_form_input',
            'input[type="text"]',
            'input[type="search"]'
        ];
        
        let searchBarFound = false;
        let workingSelector = null;
        
        for (const selector of searchBarSelectors) {
            try {
                console.log(`🔍 Trying selector: ${selector}`);
                await page.waitForSelector(selector, { timeout: 5000 });
                console.log(`✅ Found search bar with selector: ${selector}`);
                workingSelector = selector;
                searchBarFound = true;
                break;
            } catch (error) {
                console.log(`❌ Selector ${selector} not found, trying next...`);
                continue;
            }
        }
        
        if (!searchBarFound) {
            console.log(`🔍 Trying fallback approach - looking for any input field...`);
            const inputFields = await page.$$('input');
            if (inputFields.length > 0) {
                console.log(`✅ Found ${inputFields.length} input fields, using the first one`);
                workingSelector = 'input';
                searchBarFound = true;
            } else {
                throw new Error('No search bar found on DuckDuckGo page');
            }
        }
        
        console.log(`⌨️ Typing keyword: "${keyword}"`);
        // Use the working selector we found
        const searchBarSelector = workingSelector;
        
        try {
            await page.focus(searchBarSelector);
            console.log(`✅ Focused on search bar`);
            
            // Clear any existing text first
            await page.keyboard.down('Control');
            await page.keyboard.press('KeyA');
            await page.keyboard.up('Control');
            await page.keyboard.press('Delete');
            
            await page.waitForTimeout(500 + Math.random() * 1000);
            
            // Type with realistic human-like delays
            for (const char of keyword) {
                await page.keyboard.type(char);
                await page.waitForTimeout(50 + Math.random() * 150);
            }
            
            // Verify the text was typed
            const typedText = await page.$eval(searchBarSelector, el => el.value);
            console.log(`✅ Typed text: "${typedText}"`);
            
            if (typedText !== keyword) {
                console.log(`⚠️ Text mismatch! Expected: "${keyword}", Got: "${typedText}"`);
                // Try typing again
                await page.$eval(searchBarSelector, el => el.value = '');
                await page.waitForTimeout(500);
                await page.keyboard.type(keyword);
                console.log(`🔄 Retyped keyword: "${keyword}"`);
            }
            
        } catch (error) {
            console.error(`❌ Failed to focus or type in search bar: ${error.message}`);
            throw error;
        }
        
        console.log(`⏳ Waiting before pressing Enter...`);
        await page.waitForTimeout(1000 + Math.random() * 1000);
        
        console.log(`🚀 Pressing Enter to search...`);
        await page.keyboard.press('Enter');
        
        // Wait for search results
        console.log(`⏳ Waiting for search results...`);
        try {
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
            console.log(`✅ Navigation completed successfully`);
        } catch (error) {
            console.log(`⚠️ Navigation timeout, but continuing...`);
        }
        
        // Additional wait for results to load
        console.log(`⏳ Waiting for results to fully load...`);
        await page.waitForTimeout(3000 + Math.random() * 2000);
        
        // Check if we're now on search results page
        const currentUrl = page.url();
        console.log(`🌐 Current URL after search: ${currentUrl}`);
        
        if (currentUrl.indexOf('duckduckgo.com/?') !== -1 || currentUrl.indexOf('duckduckgo.com?') !== -1) {
            console.log(`✅ Successfully reached DuckDuckGo search results page!`);
        } else {
            console.log(`⚠️ May not be on search results page, but continuing...`);
        }
        
        console.log(`🔍 About to call searchResultsOnEngine with searchEngine:`, {
            name: searchEngine.config?.name,
            resultContainer: searchEngine.config?.resultContainer
        });
        
        return await searchResultsOnEngine(page, keyword, url, searchEngine, userId, country);
        
    } catch (err) {
        console.error(`❌ Error during DuckDuckGo search: ${err.message}`);
        throw err;
    }
};

// Helper function to search results on any search engine
const searchResultsOnEngine = async (page, keyword, url, searchEngine, userId, country) => {
    try {
        // Safety check for searchEngine object
        if (!searchEngine || !searchEngine.config) {
            console.error(`❌ Invalid searchEngine object:`, searchEngine);
            throw new Error('searchEngine object is missing or invalid');
        }
        
        let found = false;
        let rank = 1;
        let pageNum = 1;

        // Normalize target URL for matching
        const targetUrl = String(url).toLowerCase();
        const targetDomain = targetUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').split('/')[0];
        
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🎯 TARGET INFORMATION:`);
        console.log(`   Original URL: ${url}`);
        console.log(`   Normalized URL: ${targetUrl}`);
        console.log(`   Domain to match: ${targetDomain}`);
        console.log(`   Keyword: "${keyword}"`);
        console.log(`${'='.repeat(80)}\n`);

        for (let i = 0; i < 10; i++) {
            try {
                // Wait for results to load
                console.log(`⏳ Waiting for search results to load on page ${pageNum}...`);
                
                // Debug: Check searchEngine object
                console.log(`🔍 SearchEngine object:`, {
                    name: searchEngine.config?.name,
                    resultContainer: searchEngine.config?.resultContainer,
                    resultSelector: searchEngine.config?.resultSelector
                });
                
                // Try multiple selectors for result container
                let containerSelectors = [];
                if (searchEngine.config?.resultContainer) {
                    containerSelectors = searchEngine.config.resultContainer.split(',').map(s => s.trim());
                } else {
                    // Fallback selectors if resultContainer is undefined
                    containerSelectors = [
                        '[data-testid="result"]',
                        '.result',
                        '.web-result',
                        '.result__body',
                        '.result__snippet'
                    ];
                    console.log(`⚠️ Using fallback selectors:`, containerSelectors);
                }
                
                let containerFound = false;
                
                for (const selector of containerSelectors) {
                    try {
                        console.log(`   Trying container selector: ${selector}`);
                        await page.waitForSelector(selector, { timeout: 10000 });
                        console.log(`   ✅ Found results with selector: ${selector}`);
                        containerFound = true;
                        break;
                    } catch (e) {
                        console.log(`   ⚠️ Selector "${selector}" not found, trying next...`);
                    }
                }
                
                if (!containerFound) {
                    console.log(`⚠️ No result container found with any selector, but continuing anyway...`);
                }
                
                console.log(`✅ Results container search completed!`);
                
                // Wait a bit for dynamic content to load
                await page.waitForTimeout(2000 + Math.random() * 1000);
                
                // Try multiple methods to extract links
                let links = [];
                
                // Method 1: Try getting all anchor tags with href attributes
                try {
                    const method1Links = await page.evaluate(() => {
                        const anchors = Array.from(document.querySelectorAll('a[href]'));
                        return anchors
                            .map(a => {
                                try {
                                    return {
                                        href: a.href || '',
                                        text: (a.textContent || '').trim().substring(0, 50)
                                    };
                                } catch (e) {
                                    return null;
                                }
                            })
                            .filter(item => item && item.href && item.href.length > 10);
                    });
                    
                    links = method1Links.map(item => item.href);
                    console.log(`📊 Method 1 (All anchors): Found ${links.length} links`);
                } catch (e) {
                    console.log(`⚠️ Method 1 failed: ${e.message}`);
                }
                
                // Filter out DuckDuckGo internal links
                links = links.filter(link => {
                    const lower = link.toLowerCase();
                    return lower.indexOf('duckduckgo.com') === -1 && 
                           lower.indexOf('/?uddg=') === -1 &&
                           (lower.indexOf('http://') === 0 || lower.indexOf('https://') === 0);
                });

                console.log(`\n${'─'.repeat(80)}`);
                console.log(`📄 PAGE ${pageNum}: Found ${links.length} valid external links`);
                console.log(`${'─'.repeat(80)}`);
                
                if (links.length === 0) {
                    console.log(`⚠️ No external links found! This might be a selector/parsing issue.`);
                    console.log(`🔍 Let me take a screenshot for debugging...`);
                    try {
                        await page.screenshot({ path: `debug_page_${pageNum}.png`, fullPage: false });
                        console.log(`📸 Screenshot saved as debug_page_${pageNum}.png`);
                    } catch (screenshotErr) {
                        console.log(`⚠️ Could not save screenshot: ${screenshotErr.message}`);
                    }
                }
                
                // Show all links found
                console.log(`\n📋 ALL LINKS FOUND ON PAGE ${pageNum}:`);
                links.forEach((link, index) => {
                    console.log(`   ${index + 1}. ${link}`);
                });
                console.log('');

                for (const link of links) {
                    try {
                        if (!link || typeof link !== 'string' || link.length === 0) {
                            rank++;
                            continue;
                        }
                        
                        // Normalize the link for comparison
                        const normalizedLink = link.toLowerCase();
                        const linkDomain = normalizedLink.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').split('/')[0];
                        
                        console.log(`\n🔍 Rank #${rank}:`);
                        console.log(`   URL: ${link}`);
                        console.log(`   Domain: ${linkDomain}`);
                        console.log(`   Checking against target: ${targetDomain}`);
                        
                        // Multiple matching strategies
                        const domainMatch = linkDomain === targetDomain;
                        const domainContains = linkDomain.indexOf(targetDomain) !== -1;
                        const targetContainsDomain = targetDomain.indexOf(linkDomain) !== -1;
                        const fullUrlMatch = normalizedLink.indexOf(targetUrl.replace(/^https?:\/\//, '').replace(/^www\./, '')) !== -1;
                        
                        console.log(`   Domain exact match: ${domainMatch}`);
                        console.log(`   Domain contains target: ${domainContains}`);
                        console.log(`   Target contains domain: ${targetContainsDomain}`);
                        console.log(`   Full URL match: ${fullUrlMatch}`);
                        
                        const isMatch = domainMatch || domainContains || fullUrlMatch;
                        
                        if (isMatch) {
                            console.log(`\n${'🎉'.repeat(40)}`);
                            console.log(`🎯 ✅ MATCH FOUND! ✅`);
                            console.log(`   Rank: #${rank}`);
                            console.log(`   URL: ${link}`);
                            console.log(`   Keyword: "${keyword}"`);
                            console.log(`   Search Engine: ${searchEngine.config.name}`);
                            console.log(`${'🎉'.repeat(40)}\n`);
                            
                            await updateTrafficDataRank(userId, keyword, url, country, rank);
                            
                            // Now click on this link!
                            console.log(`🖱️ Attempting to click on the matched link...`);
                            try {
                                // Find and click the actual link element
                                const clicked = await page.evaluate((targetHref) => {
                                    const links = Array.from(document.querySelectorAll('a[href]'));
                                    const matchingLink = links.find(a => a.href === targetHref);
                                    if (matchingLink) {
                                        matchingLink.click();
                                        return true;
                                    }
                                    return false;
                                }, link);
                                
                                if (clicked) {
                                    console.log(`✅ Successfully clicked the link!`);
                                    // Wait for navigation
                                    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
                                    await page.waitForTimeout(2000);
                                } else {
                                    console.log(`⚠️ Could not click link, navigating directly...`);
                                    await page.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });
                                }
                            } catch (clickErr) {
                                console.log(`⚠️ Click failed, navigating directly: ${clickErr.message}`);
                                await page.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });
                            }
                            
                            return { found: true, rank, actualUrl: link };
                        }
                    } catch (linkError) {
                        console.log(`⚠️ Error processing link ${rank}: ${linkError.message}`);
                    }
                    rank++;
                }

                console.log(`\n❌ No match found on page ${pageNum}\n`);

                // Try to go to next page
                const nextButton = await page.$(searchEngine.nextButtonSelector);
                if (nextButton) {
                    console.log(`➡️ Going to page ${pageNum + 1}...\n`);
                    await page.waitForTimeout(1000 + Math.random() * 2000);
                    
                    await Promise.all([
                        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
                        nextButton.click(),
                    ]);
                    pageNum++;
                } else {
                    console.log(`🔚 No more pages available\n`);
                    break;
                }

            } catch (err) {
                console.error(`❌ Error on page ${pageNum}: ${err.message}`);
                console.error(`   Stack: ${err.stack}`);
                break;
            }
        }

        if (!found) {
            console.log(`\n${'❌'.repeat(40)}`);
            console.log(`❌ URL NOT FOUND: ${url}`);
            console.log(`   Keyword: "${keyword}"`);
            console.log(`   Pages searched: ${pageNum}`);
            console.log(`   Total links checked: ${rank - 1}`);
            console.log(`${'❌'.repeat(40)}\n`);
        }

        return { found: false, rank: null };
    } catch (err) {
        console.error(`❌ Error searching results on ${searchEngine.config.name}: ${err.message}`);
        throw err;
    }
};

// Helper function to search on DuckDuckGo
const searchKeywordOnDuckDuckGo = async (page, keyword, url, searchEngine, userId, country) => {
    try {
        console.log(`🦆 Using DuckDuckGo search method`);
        return await duckDuckGoSearch(page, keyword, url, searchEngine, userId, country);
    } catch (err) {
        console.error(`❌ Error during DuckDuckGo search: ${err.message}`);
        throw err;
    }
};

const generateTraffic = ({ url, keyword, stayTime, numBots, country, userId }) => {
    return async () => {
        console.log(`\n🚀 Starting traffic generation for ${url} with keyword "${keyword}"`);
        console.log(`📊 Running ${numBots} bot(s) with ${stayTime}ms stay time`);
        console.log(`🌍 Target country: ${country}`);
        console.log(`👤 User ID: ${userId}\n`);
        
        let browser;
        try {
            // Heroku-compatible Puppeteer configuration
            const isHeroku = process.env.DYNO || process.env.HEROKU_APP_NAME;
            const isProduction = process.env.NODE_ENV === 'production';
            
            const puppeteerArgs = [
                "--no-sandbox", 
                "--disable-setuid-sandbox", 
                '--disable-infobars',
                '--disable-blink-features=AutomationControlled',
                '--disable-features=VizDisplayCompositor',
                '--disable-web-security',
                '--disable-dev-shm-usage',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ];
            
            // Add additional args for Heroku
            if (isHeroku || isProduction) {
                puppeteerArgs.push(
                    '--single-process',
                    '--no-zygote',
                    '--disable-extensions',
                    '--disable-plugins',
                    '--disable-images',
                    '--disable-javascript',
                    '--disable-default-apps'
                );
            }
            
            browser = await puppeteer.launch({
                args: puppeteerArgs,
                headless: isHeroku || isProduction ? true : false, // Always headless on Heroku
                devtools: false,
                defaultViewport: null,
                ignoreDefaultArgs: ['--enable-automation'],
                timeout: 60000,
                protocolTimeout: 60000
            });

            // Function to simulate realistic website interaction with SEO analysis
            const interactWithWebsite = async (page, url, stayTime, userId, keyword, country) => {
                try {
                    console.log(`🌐 Navigating to website: ${url}`);
                    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

                    console.log(`🔍 Starting SEO metadata extraction...`);
                    // Extract comprehensive SEO metadata
                    const seoMetadata = await extractSEOMetadata(page, url);
                    
                    if (seoMetadata) {
                        console.log(`📊 SEO Analysis Results:`);
                        console.log(`   Title: ${seoMetadata.metaTags.title || 'N/A'}`);
                        console.log(`   Description: ${seoMetadata.metaTags.description ? seoMetadata.metaTags.description.substring(0, 100) + '...' : 'N/A'}`);
                        console.log(`   H1 Tags: ${seoMetadata.headings.h1.length}`);
                        console.log(`   H2 Tags: ${seoMetadata.headings.h2.length}`);
                        console.log(`   Images: ${seoMetadata.contentAnalysis.imageCount}`);
                        console.log(`   Word Count: ${seoMetadata.contentAnalysis.wordCount}`);
                        console.log(`   Internal Links: ${seoMetadata.contentAnalysis.internalLinks}`);
                        console.log(`   External Links: ${seoMetadata.contentAnalysis.externalLinks}`);
                        console.log(`   SSL Enabled: ${seoMetadata.technicalSEO.sslEnabled}`);
                        console.log(`   Mobile Friendly: ${seoMetadata.technicalSEO.mobileFriendly}`);
                        console.log(`   Schema Markup: ${seoMetadata.technicalSEO.hasSchema}`);
                        console.log(`   Load Time: ${seoMetadata.performance.loadTime}ms`);
                        console.log(`   SEO Score: ${seoMetadata.seoScore.overall}/100`);
                        
                        // Store detailed metadata in WebsiteMetadata collection
                        await storeWebsiteMetadata(userId, keyword, url, seoMetadata);
                        
                        // Update TrafficData with basic SEO info
                        const basicSEOData = {
                            title: seoMetadata.metaTags.title,
                            description: seoMetadata.metaTags.description,
                            keywords: seoMetadata.metaTags.keywords,
                            h1Tags: seoMetadata.headings.h1,
                            h2Tags: seoMetadata.headings.h2,
                            h3Tags: seoMetadata.headings.h3,
                            imageCount: seoMetadata.contentAnalysis.imageCount,
                            internalLinks: seoMetadata.contentAnalysis.internalLinks,
                            externalLinks: seoMetadata.contentAnalysis.externalLinks,
                            wordCount: seoMetadata.contentAnalysis.wordCount,
                            pageLoadTime: seoMetadata.performance.loadTime,
                            hasSchema: seoMetadata.technicalSEO.hasSchema,
                            schemaTypes: seoMetadata.technicalSEO.schemaTypes
                        };
                        
                        await updateTrafficDataWithSEO(userId, keyword, url, country, basicSEOData);
                        console.log(`💾 SEO metadata stored in database`);
                    } else {
                        console.log(`⚠️ Failed to extract SEO metadata`);
                    }

                    console.log(`⏱️ Staying on website for ${stayTime}ms...`);
                    // Stay on the website for the specified time
                    await page.waitForTimeout(stayTime);

                    console.log(`📜 Scrolling through the page...`);
                    // Scroll the page naturally
                    await page.evaluate(async () => {
                        await new Promise(resolve => {
                            let totalHeight = 0;
                            const distance = 100;
                            const timer = setInterval(() => {
                                window.scrollBy(0, distance);
                                totalHeight += distance;

                                if (totalHeight >= document.body.scrollHeight) {
                                    clearInterval(timer);
                                    resolve();
                                }
                            }, 100);
                        });
                    });

                    // Optionally open a random link on the website
                    try {
                        const internalLinks = await page.$$eval('a', as => {
                            return as
                                .map(a => a.href)
                                .filter(href => {
                                    if (!href) return false;
                                    try {
                                        // Check if it's a valid URL string
                                        return href.indexOf('http://') === 0 || href.indexOf('https://') === 0;
                                    } catch (e) {
                                        return false;
                                    }
                                });
                        });
                        
                        console.log(`🔗 Found ${internalLinks.length} valid internal links`);
                        
                        if (internalLinks.length > 0) {
                            const randomLink = internalLinks[Math.floor(Math.random() * internalLinks.length)];
                            console.log(`🔗 Clicking random internal link: ${randomLink}`);
                            await page.goto(randomLink, { waitUntil: 'networkidle2', timeout: 60000 });
                            await page.waitForTimeout(stayTime / 2); // Stay on the linked page for half the time
                        }
                    } catch (linkError) {
                        console.log(`⚠️ Could not process internal links: ${linkError.message}`);
                    }

                    console.log(`✅ Website interaction and SEO analysis completed successfully`);
                    return true;
                } catch (err) {
                    console.error(`❌ Error interacting with website ${url}: ${err.message}`);
                    return false;
                }
            };

            const bots = [];
            for (let i = 0; i < numBots; i++) {
                bots.push(new Promise(async (resolve) => {
                    const page = await browser.newPage();
                    try {
                        // Set realistic viewport and user agent
                        await page.setViewport({ width: 1366, height: 768 });
                        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
                        
                        // Additional stealth measures
                        await page.evaluateOnNewDocument(() => {
                            Object.defineProperty(navigator, 'webdriver', {
                                get: () => undefined,
                            });
                        });
                        
                        // Disable request interception for now to avoid navigation conflicts
                        // await page.setRequestInterception(true);

                        // Get DuckDuckGo configuration
                        const searchEngine = getDuckDuckGoConfig();
                        console.log(`🤖 Bot ${i + 1} starting with ${searchEngine.config.name} search engine`);
                        
                        // Search for the keyword on DuckDuckGo
                        const searchResult = await searchKeywordOnDuckDuckGo(page, keyword, url, searchEngine, userId, country);
                        
                        if (searchResult.found) {
                            console.log(`\n${'═'.repeat(80)}`);
                            console.log(`🎯 Bot ${i + 1} FOUND the URL on ${searchEngine.config.name} at rank #${searchResult.rank}!`);
                            console.log(`   Target URL: ${url}`);
                            console.log(`   Found URL: ${searchResult.actualUrl || 'N/A'}`);
                            console.log(`${'═'.repeat(80)}\n`);
                            
                            // The page should already be on the target website from the click
                            // But if not, navigate to it
                            const currentPageUrl = page.url();
                            console.log(`📍 Current page after click: ${currentPageUrl}`);
                            
                            const targetDomainCheck = url.replace(/^https?:\/\//, '').split('/')[0];
                            if (currentPageUrl.toLowerCase().indexOf(targetDomainCheck.toLowerCase()) === -1) {
                                console.log(`⚠️ Not on target page, navigating directly...`);
                                await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
                            }
                            
                            // Interact with the website
                            console.log(`🤖 Bot ${i + 1} starting website interaction...`);
                            const interactionSuccess = await interactWithWebsite(page, url, stayTime, userId, keyword, country);
                            
                            if (interactionSuccess) {
                                console.log(`✅ Bot ${i + 1} successfully completed full interaction with the website.`);
                            }
                            
                            // Update hits counter
                            await updateTrafficDataHits(userId, keyword, url, country, 1);
                            console.log(`📊 Updated hit counter in database for bot ${i + 1}`);
                        } else {
                            console.log(`\n❌ Bot ${i + 1} did not find the URL on ${searchEngine.config.name}.\n`);
                        }
                    } catch (err) {
                        console.error(`Error in bot ${i + 1}: ${err.message}`);
                    } finally {
                        await page.close();
                        resolve();
                    }
                }));
            }

            await Promise.all(bots);
            console.log(`\n🎉 All bots completed successfully!`);
        } catch (err) {
            console.error(`❌ Error generating traffic inside Puppeteer: ${err.message}`);
            throw err;
        } finally {
            if (browser) {
                console.log(`🔒 Closing browser...`);
                await browser.close();
            }
        }
    };
};

const findWebsiteByKeyword = async ({ url, keyword, userId, country }) => {
    let browser;
    try {
        // Heroku-compatible Puppeteer configuration
        const isHeroku = process.env.DYNO || process.env.HEROKU_APP_NAME;
        const isProduction = process.env.NODE_ENV === 'production';
        
        const puppeteerArgs = [
            "--no-sandbox", 
            "--disable-setuid-sandbox", 
            '--disable-infobars',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=VizDisplayCompositor',
            '--disable-web-security',
            '--disable-dev-shm-usage',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
        ];
        
        // Add additional args for Heroku
        if (isHeroku || isProduction) {
            puppeteerArgs.push(
                '--single-process',
                '--no-zygote',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-images',
                '--disable-javascript',
                '--disable-default-apps'
            );
        }
        
        browser = await puppeteer.launch({
            args: puppeteerArgs,
            headless: isHeroku || isProduction ? true : false, // Always headless on Heroku
            devtools: false,
            defaultViewport: null,
            ignoreDefaultArgs: ['--enable-automation'],
            timeout: 60000,
            protocolTimeout: 60000
        });

        const page = await browser.newPage();
        
        // Set realistic viewport and user agent
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Additional stealth measures
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        });
        
        // Disable request interception for now to avoid navigation conflicts
        // await page.setRequestInterception(true);

        // Try DuckDuckGo to find the website
        try {
            const searchEngine = getDuckDuckGoConfig();
            const searchResult = await searchKeywordOnDuckDuckGo(page, keyword, url, searchEngine, userId, country);
            
            if (searchResult.found) {
                console.log(`✅ Website found on DuckDuckGo at rank #${searchResult.rank}`);
                await page.close();
                return true;
            }
            
        } catch (err) {
            console.error(`❌ Error searching on DuckDuckGo: ${err.message}`);
        }

        await page.close();
        console.log(`❌ Website not found on DuckDuckGo for keyword "${keyword}"`);
        return false;
        
    } catch (err) {
        console.error(`Error finding website by keyword: ${err.message}`);
        throw err;
    } finally {
        if (browser) await browser.close();
    }
};

module.exports = { generateTraffic, findWebsiteByKeyword };
