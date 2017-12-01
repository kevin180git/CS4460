selectedYear = 2010;
selectedGenre = "All Genres";

function search(){
    var text = d3.select('#searchInput').node().value;
    updateChart(selectedYear, selectedGenre, text);
    makeTrellis(selectedYear, selectedGenre, text);   
}

function clearSearch() {
    d3.select('#searchInput').node().value = "";
    updateChart(selectedYear, selectedGenre, '/');
    makeTrellis(selectedYear, selectedGenre, '/');  
}

function onYearChanged() {
    var select = d3.select('#yearSelect').node();
    selectedYear = select.options[select.selectedIndex].value;
    updateChart(selectedYear,selectedGenre, '/');
    makeTrellis(selectedYear, selectedGenre, '/');
}

function onGenreChanged() {
    var select = d3.select('#genreSelect').node();
    selectedGenre = select.options[select.selectedIndex].value;
    updateChart(selectedYear, selectedGenre, '/');
    makeTrellis(selectedYear, selectedGenre, '/');
}

var xAttributes = ['budget', 'duration', 'directFbLikes', 'castTotalLikes'];

function Cell(x, y, attr) {
    this.x = x;
    this.y = y;
}

Cell.prototype.init = function(g) {
    var cell = d3.select(g);

    xScale.range([0, trellisWidth]).domain(extentMap[this.x]);

    var xAxis = cell.append('g')
        .attr('class', 'trellis axis x')
        .attr('transform', 'translate(' +[0, trellisHeight]+ ')')
        .call(d3.axisBottom(xScale));

    var yAxis = cell.append('g')
        .attr('class', 'trellis axis y')
        .call(d3.axisLeft(grossScale).tickFormat(d3.format(".2s")));

}

Cell.prototype.update = function(g, dataset) {
    var cell = d3.select(g);

    var _this = this;
    var attribute = this.x;
    var gross = this.y;

    var dots = cell.selectAll('.dot')
        .data(dataset);

    console.log(dataset)

    var dotsEnter = dots.enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('r', 2);

    dots.merge(dotsEnter)
        .transition()
        .duration(600)
        .attr('cx', function(d) {
            
            return xScale(d[attribute]);
        })
        .attr('cy', function(d) {
            return grossScale(d[gross]);
        })

    dots.exit().remove()

}

var cells = [];
xAttributes.forEach(function(attr) {
    cells.push(new Cell(attr, 'gross'));
})



var imgDict = {};
var flag = true;

var svg = d3.select('svg');

var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

var padding = {t: 50, r: 80, b: 40, l: 60};

var chartWidth = svgWidth/2;
var chartHeight = 650 - padding.t - padding.b;

var histogramWidth = chartWidth - padding.l;
var histogramHeight = chartHeight;

var trellisWidth = svgWidth/5;
var trellisHeight = svgHeight/4;

var domains = { 'imdb' : [0.0, 10.0] };

var bubbleChart = svg.append('g')
    .attr('class', 'bubblechart')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');

var histogramChart = svg.append('g')
    .attr('class', 'histogram')
    .attr('transform', 'translate('+[chartWidth + padding.l + 200, padding.t]+')');

var trellis = svg.append('g')
    .attr('class', 'trellis')
    .attr('transform', 'translate('+[padding.l, chartHeight+padding.r + padding.t]+')');

var legendColors = ['#00ff00','#0d66ba','#ec973c','#ff0000','#b42695', '#232323'];
var legendWords = ['G', 'PG','PG-13', 'R', 'Unrated', 'Not Rated'];
var contentRatingArr = [['G','#00ff00'],['PG','#0d66ba'],['PG-13','#ec973c'],['R','#ff0000'],['Unrated','#b42695'],['Not Rated','#232323']];

var genres = [];

var xScale = d3.scaleLinear()
var yScale = d3.scaleLinear().range([chartHeight,0]).domain(domains['imdb']);
var rScale = d3.scaleSqrt().range([0,40]);
var grossScale = d3.scaleLinear().range([trellisHeight, 0])

d3.csv('./data/movies.csv',
    function(d){
        return {
            gross: +d.gross,
            budget: +d.budget,
            movieTitle: d.movie_title,
            year: +d.title_year,
            directorName: d.director_name,
            directFbLikes: +d.director_facebook_likes,
            actor1: d.actor_1_name,
            actor2: d.actor_2_name,
            actor3: d.actor_3_name,
            a1Likes: +d.actor_1_facebook_likes,
            a2Likes: +d.actor_2_facebook_likes,
            a3Likes: +d.actor_3_facebook_likes,
            castTotalLikes: +d.cast_total_facebook_likes,
            movieLikes: +d.movie_facebook_likes,

            genres: d.genres,
            imdbScore: +d.imdb_score,
            language: d.language,
            country: d.country,
            contentRating: d.content_rating,
            duration: +d.duration,

            color: d.color,
            numCritForReviews: +d.num_critic_for_reviews,
            numUserForReviews: +d.num_user_for_reviews,
            numVotedUsers: +d.num_voted_users,
            faceNumInPoster: +d.facenumber_in_poster,
            plotKeywords: d.plot_keywords,
            imdbLink: d.movie_imdb_link,
            aspectRatio: +d.aspect_ratio,

        }
    },
    function(error, dataset){
        if(error) {
            console.error('Error you fucked up the dataset just start crying.');
            console.error(error);
            return;
        }

        //Global
        movies = dataset.filter(function(d){
            return !(d.contentRating.includes("TV"));
        });


        grossExtent = d3.extent(dataset, function(d){ return d.gross; });
        budgetExtent = d3.extent(dataset, function(d) { return d.budget; });
        maxDirectorLikes = d3.max(dataset, function(d) { return d.directFbLikes; });
        maxCastLikes = d3.max(dataset, function(d) { return d.castTotalLikes; });
        maxDuration = d3.max(dataset, function(d) { return d.duration; });

        extentMap = { 'budget' : budgetExtent,
                      'duration' : [0, maxDuration],
                      'directFbLikes' : [0, maxDirectorLikes],
                      'castTotalLikes' : [0, maxCastLikes] }

        grossScale.domain(grossExtent);

        nestByMovieTitle = d3.nest()
            .key(function(d) { return d.movieTitle})
            .entries(dataset);

        makeHistogram();
        updateChart(selectedYear, selectedGenre, '/');
        getAllGenres(dataset);
        addLegend(legendColors, legendWords);
        makeTrellis(selectedYear, selectedGenre, '/');

    });

function loadDoc(movieTitle,link) {
    const proxyurl = "https://cors-anywhere.herokuapp.com/";
    const url = link;
    return fetch(proxyurl + url)
    .then(response => response.text())
    .then(function(contents) {
        var outerDummy = $( contents );
        var jQuerySelector = $('.poster a img', outerDummy)
        var imgUrl = jQuerySelector.attr('src');
        var randomname = new Image(imgUrl); //cache image?
        imgDict[movieTitle] = imgUrl;

        return imgUrl;


    })
    .catch(() => console.log("Can’t access " + url + " response. Blocked by browser?"))

}

function addLegend(legendColors, legendWords) {
    var legend = bubbleChart.selectAll('.legend')
    .data([1])
    .enter()
    .append('g')
    .attr('class', 'legend')
    .attr('transform', 'translate('+[chartWidth - 250, chartHeight - 200]+')');

    legend.append('rect')
        .attr('x', 0)
        .attr('y', -30)
        .attr('height', 170)
        .attr('width', 110)
        .style('fill', '#eee')
        .style('opacity', '0.8');

    legend.append('text')
            .attr('x', 0)
            .attr('y', -20)
            .attr('dy', '0.7em')
            .attr('transform', function(a,b) {
                return 'translate( '+ [10, 0]+ ')';})
            .text('Color based on')
            .style('font-size', '0.7em')
            .style('text-anchor', 'start');
    legend.append('text')
        .attr('x', 0)
        .attr('y', -20)
        .attr('dy', '0.7em')
        .attr('transform', function(a,b) {
            return 'translate( '+ [10, 15]+ ')';})
        .text('Content Rating')
        .style('font-size', '0.7em')
        .style('text-anchor', 'start');

    legendColors.forEach(function(d) {
        var legendItems = legend.selectAll('.legendItems')
            .data(legendColors);

        var legendItemsEnter = legendItems.enter()
        .append('g')
        .attr('class', 'legendItems');

        legendItemsEnter.append('rect')
            .attr('x', 20)
            .attr('y', 10)
            .attr('height', 15)
            .attr('width', 15)
            .attr('transform', function(a,b) {
                return 'translate( '+ [0, b*15 + 10]+ ')';})
            .style('fill', function(d) {return d;})
            .style('opacity', '0.7');

        legendItemsEnter.append('text')
            .attr('x', 40)
            .attr('y', 20)
            .attr('dy', '0.7em')
            .attr('transform', function(a,b) {
                return 'translate( '+ [0, b*15 + 3]+ ')';})
            .text(function(d,i) {
                return legendWords[i];
            })
            .style('font-size', '0.7em')
            .style('text-anchor', 'start');

    })
}

function getAllGenres(dataset) {
    var set = new Set()
    dataset.forEach(function(d) {
        var temp = d['genres'].split('|');
        temp.forEach(function(v) {
            set.add(v);
        })
    })

    var sorted = Array.from(set).sort();

    genreSelect = d3.select('#genreSelect');
    genreOptions = genreSelect.selectAll('option')
        .data(sorted)
        .enter()
        .append('option')
        .text(function (d) { return d; })

}

function updateChart(year, genre, text) {
    var filtered;

    if(text != '/') {
        filtered = movies.filter(function(d) {
            var title = d['movieTitle'].toLowerCase();
            return title.includes(text.toLowerCase());
        })
    } else {
        var filteredYears = movies.filter(function(d){
            if (year == "All") {return true;}
            return year == d.year;
        });

        var filteredYearAndGenres = filteredYears.filter(function(d){
            if (genre == "All Genres") {return true;}
            return d.genres.includes(genre);
        });
        filtered = filteredYearAndGenres;
    }
   

    var dot = svg.selectAll('.block')
        .classed('filtered', function(d) {
            var yearFilter;
            var genreFilter;

            if(year == "All") {
                yearFilter = true;
            } else {
                yearFilter = year == d.year;
            }

            if (genre == "All Genres") {
                genreFilter = true;
            } else {
                genreFilter = d.genres.includes(genre);
            }
            return yearFilter && genreFilter;
        })

    

    var maxLikes = d3.max(filtered, function(d){
        return d.movieLikes;
    });

    xScale.domain([0, maxLikes*1.2]).range([0, chartWidth-padding.l]);

    rScale.domain(grossExtent);

    var xGrid = bubbleChart.append('g')
         .attr('class', 'xGrid')
         .attr('transform', 'translate('+[0, chartHeight]+')')
         .call(d3.axisBottom(xScale).ticks(8)
             .tickSizeInner(-chartHeight)
             .tickFormat(d3.format("s")));

     var yGrid = bubbleChart.append('g')
        .attr('class', 'yGrid')
         .call(d3.axisLeft(yScale).ticks(10)
         .tickSizeInner(-chartWidth+padding.l)
         .tickFormat(d3.format(".1f")));


    var bChart = bubbleChart.selectAll('.bChart')
        .data(filtered, function(d) { return d.movieTitle});

    var bChartEnter = bChart.enter()
        .append('g')
        .attr('class', 'bChart')
        .on('mouseover', function(d){
            //flag = true;
            console.log(flag);

            svg.selectAll('.dot')
                .classed('hidden', function(v) {
                    return v != d;
                })

            bubbleChart.selectAll('image').remove();
            flag = true;
            loadDoc(d.movieTitle, d.imdbLink).then((ans) => {
                bubbleChart.append('svg:image')
                .attr('class', 'image')
                .attr('transform','translate(' + (chartWidth-50) + ','+chartHeight/2+')')
                .attr('width', 200)
                .attr('height', 240)
                .attr("xlink:href", function(d) {
                    if (flag == true) {
                        return ans;
                    }
                });
            });



            var hoveredMatch = svg.selectAll('.bData')
            .classed('hovered', function(i) {
                return (d.movieTitle == i.movieTitle);
            });


        })
        .on('mouseout', function(d){
            flag = false;
            var hoverMatched = svg.selectAll('.bData')
            .classed('hovered', function(i) {
                return false;
            });

            bubbleChart.selectAll('image').remove();

        });

    var bData = bubbleChart.selectAll('.bData')
        .data(movies); //has to be movies not filtered, else data will show only 2010

    var bDataEnter = bData.enter()
        .append('g')
        .attr('class', 'bData')
        .attr('transform','translate(' + (chartWidth+50) + ',' + (chartHeight/4)+')');


    bChart.merge(bChartEnter)
        .transition()
        .duration(600)
        .attr('transform', function(d){
            return 'translate(' +(xScale(d.movieLikes))+ ', ' + (yScale(d.imdbScore)) + ')'; // Update position based on index
        });

    bChartEnter.append('circle')
        .transition()
        .duration(600)
        .attr('r', function(d) {
            return rScale(d.gross);
        })
        .style('fill', function(d){
            if (d.contentRating === "G") {
                return '#00ff00';
            } else if (d.contentRating === "PG") {
                return '#0d66ba';
            } else if (d.contentRating === "PG-13") {
                return '#ec973c';
            } else if (d.contentRating === "R") {
                return '#ff0000';
            } else if (d.contentRating === "Unrated") {
                return '#b42695';
            } else if (d.contentRating === "Not Rated") {
                return '#232323';
            } else {

            }
        });

    bChartEnter.append('text')
        .attr('dy', '0.7em')
        .text(function(d){
                return d.movieTitle;
            });

    var spacing = 18;
    bDataEnter.append('text').attr('transform','translate(0,0)').text(function(d,i){
        return d.movieTitle + '(' + d.year + ')';}
        ).style('font-weight','bold');
    bDataEnter.append('text').attr('transform','translate(0,'+(spacing * 1)+')').text(function(d){ return 'Director: ' + d.directorName;});
    bDataEnter.append('text').attr('transform','translate(0,'+(spacing * 2)+')').text(function(d){ return 'Stars: ' + d.actor1 + ','});
    bDataEnter.append('text').attr('transform','translate(0,'+(spacing * 3)+')').text(function(d){ return  d.actor2 + ', ' + d.actor3;});
    bDataEnter.append('text').attr('transform','translate(0,'+(spacing * 4)+')').text(function(d){ return 'Gross: $' + d.gross;});
    bDataEnter.append('text').attr('transform','translate(0,'+(spacing * 5)+')').text(function(d){ return 'Budget: $' + d.budget;});
    bDataEnter.append('text').attr('transform','translate(0,'+(spacing * 6)+')').text(function(d){ return 'Content Rating: ' + d.contentRating;}).style('fill', function(d) { return getContentColor(d.contentRating); });
    // bDataEnter.append('svg:image')
    //     .attr('class', 'image')
    //     .attr('transform','translate(-100,'+(spacing * 7)+')')
    //     .attr('width', 200)
    //     .attr('height', 240)
    //     .attr("xlink:href", function(d) {
    //         return loadDoc(d.imdbLink);
    //     })
    bChart.exit().remove();
    bData.exit().remove();
}


function getContentColor(rating) {
    for (i in contentRatingArr) {
        if (rating == contentRatingArr[i][0]) {
            return contentRatingArr[i][1];
        }
    }
}



function makeHistogram() {
    var hScale = d3.scaleLinear().domain(domains['imdb']).range([histogramHeight, 0]);

    var histogram = d3.histogram()
        .domain(hScale.domain())
        .thresholds(hScale.ticks(40))
        .value(function(d) {
            return d['imdbScore'];
        });

    var bins = histogram(movies)

    xScale.domain([0, 130]).range([0, histogramWidth/2])

    var xAxis = histogramChart.append('g')
        .attr('class', 'histogram x axis')
        .attr('transform', 'translate('+[0, histogramHeight]+')')
        .call(d3.axisBottom(xScale));

    var yAxis = histogramChart.append('g')
        .attr('class', 'histogram y axis')
        .call(d3.axisLeft(hScale));

    var binContainer = histogramChart.selectAll('.bin')
        .data(bins);

    var binContainerEnter = binContainer.enter()
        .append('g')
        .attr('class', 'bin')

    binContainer.merge(binContainerEnter)
        .transition()
        .duration(600)
        .attr('transform', function(d) {
            return 'translate(' +[0, hScale(d['x0'])]+ ')';
        });

    var blocks = binContainerEnter.selectAll('.block')
        .data(function(d) {
            return d.map(function(v) {
                return v;
            })
        })

    var blockEnter = blocks.enter()
        .append('rect')
        .attr('class', 'block')
        .attr('width', 1.5)
        .attr('height', 10)
        .attr('x', function(d, i) {
            return xScale(i)+1.5;
        })

}


function makeTrellis(year, genre, text) {
    if(text != '/') {
        filtered = movies.filter(function(d) {
            var title = d['movieTitle'].toLowerCase();
            return title.includes(text.toLowerCase());
        })
    } else {
        var filteredYears = movies.filter(function(d){
            if (year == "All") {return true;}
            return year == d.year;
        });

        var filteredYearAndGenres = filteredYears.filter(function(d){
            if (genre == "All Genres") {return true;}
            return d.genres.includes(genre);
        });
        filtered = filteredYearAndGenres;
    }

    var charts = trellis.selectAll('.cell')
        .data(cells)
        .enter()
        .append('g')
        .attr('class', 'cell')
        .attr("transform", function(d, i) {
            return 'translate(' +[1.2 * trellisWidth * i]+ ')';
        });

    xAttributes.forEach(function(attribute, i) {

        var cell = trellis.append('g')
            .attr('class', 'cell')
            .attr("transform", function(d) {
                return 'translate(' +[1.2 * trellisWidth * i]+ ')';
            });

        /*trellis.append('rect')
            .attr('width', trellisWidth)
            .attr('height', trellisHeight)
            .attr("transform", function(d) {
                return 'translate(' +[1.2 * trellisWidth * i]+ ')';
            });*/

        xScale.range([0, trellisWidth]).domain(extentMap[attribute]);

        var xAxis = cell.append('g')
            .attr('class', 'trellis axis x')
            .attr('transform', 'translate(' +[0, trellisHeight]+ ')')
            .call(d3.axisBottom(xScale));

        var yAxis = cell.append('g')
            .attr('class', 'trellis axis y')
            .call(d3.axisLeft(grossScale).tickFormat(d3.format(".2s")));

        var dots = cell.selectAll('.dot')
            .data(filtered);

        var dotsEnter = dots.enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('r', 2);

        dots.merge(dotsEnter)
            .transition()
            .duration(600)
            .attr('cx', function(d) {
                
                return xScale(d[attribute]);
            })
            .attr('cy', function(d) {
                return grossScale(d['gross']);
            })

        dots.exit().remove();

        })

    /*console.log(charts)
    charts.each(function(cell) {
        console.log('yy')
        cell.init(this);
        cell.update(this, filteredYearAndGenres);
    })*/
   
}