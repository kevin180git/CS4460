selectedYear = 2010;
selectedGenre = "All Genres";

function onYearChanged() {
    var select = d3.select('#yearSelect').node();
    // Get current value of select element
    selectedYear = select.options[select.selectedIndex].value;
    // Update chart with the selected category of letters
    updateChart(selectedYear,selectedGenre);
}

function onGenreChanged() {
    var select = d3.select('#genreSelect').node();
    // Get current value of select element
    selectedGenre = select.options[select.selectedIndex].value;
    // Update chart with the selected category of letters
    updateChart(selectedYear, selectedGenre);
}

var svg = d3.select('svg');

var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

var padding = {t: 60, r: 300, b: 40, l: 40};

var bubbleChart = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');

var chartWidth = svgWidth - padding.l - padding.r;
var chartHeight = svgHeight - padding.t - padding.b;

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
        datum = dataset

        nestByMovieTitle = d3.nest()
            .key(function(d) { return d.movieTitle})
            .entries(dataset);

        console.log(nestByMovieTitle)
        //console.log(nestByMovieTitle[1112]) //Avengers

        var xExtent = d3.extent(dataset, function(d){ return d.movieLikes; });
        xScale = d3.scaleLinear().domain(xExtent).range([0, chartWidth]);

        var yExtent = d3.extent(dataset, function(d){ return d.imdbScore; });
        yScale = d3.scaleLinear().domain(yExtent).range([chartHeight,0]);

        var rExtent = d3.extent(dataset, function(d){ return d.gross; });
        rScale = d3.scaleSqrt().domain(rExtent).range([0,100]);

        var xGrid = svg.append('g')
            .attr('class', 'xGrid')
            .attr('transform', 'translate('+[padding.l, svgHeight - padding.b]+')')
            .call(d3.axisBottom(xScale).ticks(8)
                .tickSizeInner(-chartHeight)
                .tickFormat(d3.format(".1r")));

        var yGrid = svg.append('g')
            .attr('class', 'yGrid')
            .attr('transform', 'translate('+[padding.l, padding.t]+')')
            .call(d3.axisLeft(yScale).ticks(6)
                .tickSizeInner(-chartWidth)
                .tickFormat(d3.format(".1f")));

        updateChart(selectedYear,selectedGenre);
        getAllGenres();
        //updateChartG("All Genres");

    });

function getAllGenres() {
    nestByGenres = d3.nest()
            .key(function(d) { return d.genres})
            .entries(datum);

    diffGenres = [];

    for(i in nestByGenres) { //i is index
        var arrGenre = nestByGenres[i].key.split("|");
        for (j in arrGenre) {
            if (!diffGenres.includes(arrGenre[j])) {
                diffGenres.push(arrGenre[j]);
            }
        }
    }
    console.log(diffGenres);

}

function updateChart(year, genre) {
    var filteredYears = datum.filter(function(d){
        if (year == "All") {return true;}
        return year == d.year;
    });

    var filteredYearAndGenres = filteredYears.filter(function(d){
        if (genre == "All Genres") {return true;}
        return d.genres.includes(genre);
    });

    var bChart = bubbleChart.selectAll('.bChart')
        .data(filteredYearAndGenres, function(d) { return d.movieTitle});

    var bChartEnter = bChart.enter()
        .append('g')
        .attr('class', 'bChart');

    bChart.merge(bChartEnter)
        .attr('transform', function(d){
            if (d.movieLikes > 300000) {
                console.log(d.movieTitle);
            }
            return 'translate(' +(xScale(d.movieLikes))+ ', ' + (yScale(d.imdbScore)) + ')'; // Update position based on index
        });

    bChartEnter.append('circle')
        .attr('r', function(d) {
            return rScale(d.gross);
        })
        .style('fill', function(d){
            if (d.contentRating.includes("TV")) {
                //console.log(d.contentRating);
                return '#b42695';
            } else if (d.contentRating === "G") {
                return '#ccff99';
            } else if (d.contentRating === "PG") {
                return '#00ff00';
            } else if (d.contentRating === "PG-13") {
                return '#ffff66';
            } else if (d.contentRating === "R") {
                return '#ff0000';
            } else if (d.contentRating === "Unrated") {
                return '#daf2ea';
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
    bChart.exit().remove();

}
