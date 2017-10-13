
function makeChart(data,stylename,media,plotpadding,legAlign,yAlign){


    var config = {
        "semilog":true,
        "scale":true,
        "colour":true,
        "animate":true,
        "maxCircle":120,
        "speed":1000,
        "index":0
    }

    var titleYoffset = d3.select("#"+media+"Title").node().getBBox().height
    var subtitleYoffset=d3.select("#"+media+"Subtitle").node().getBBox().height;

    // return the series names from the first row of the spreadsheet
    var seriesNames = Object.keys(data[0]).filter(function(d){ return d != 'date'&& d!='country'&&d!='region' });
    //Select the plot space in the frame from which to take measurements
    var frame=d3.select("#"+media+"chart")
    var plot=d3.select("#"+media+"plot")



    var yOffset=d3.select("#"+media+"Subtitle").style("font-size");
    yOffset=Number(yOffset.replace(/[^\d.-]/g, ''));
    
    //Get the width,height and the marginins unique to this chart
    var w=plot.node().getBBox().width;
    var h=plot.node().getBBox().height;
    var margin=plotpadding.filter(function(d){
        return (d.name === media);
      });
    margin=margin[0].margin[0]
    var colours=stylename.linecolours;
    var plotWidth = w-(margin.left+margin.right);
    var plotHeight = h-(margin.top+margin.bottom);

    //temporary rect frame
    //frame.append("rect").attr("width",1920).attr("height",1080).attr("fill","black").attr("opacity",0.1)
    
    // console.log(plotWidth,colours,plotHeight,data)
    // console.log(margin)
    //you now have a chart area, inner margin data and colour palette - with titles pre-rendered

    //var years = [
//1800,1810,1820,1830,1840,1850,1860,1870,1880,1890,1900,1910,1920,1930,1940,1950,1951,1952,1953,1954,1955,1956,1957,1958,1959,1960,1961,1962,1963,1964,1965,1966,1967,1968,1969,1970,1971,1972,1973,1974,1975,1976,1977,1978,1979,1980,1981,1982,1983,1984,1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015
    //]

    var years = d3.range(1967,2016);


    var lifeFields=[]
    var gdpFields=[]
    var popFields=[]


    seriesNames.forEach(function(d,i){
        if(d.match("^gdp_")){
            gdpFields.push(d);
        }
        if(d.match("^Life_")){
            lifeFields.push(d);
        }
        if(d.match("^pop_")){
            popFields.push(d);
        }
    })

    //let's manipulate data into right format
    var chartData=[];
    var maxLife = 0;
    var maxPop = 0;
    var maxGDP = 0;

    data.forEach(function(d,i){
        //console.log(d)
        var obj = new Object();
        obj.name = d.country;
        obj.region = d.region;
        obj.label=d.label;
        obj.life=[];
        obj.gdp=[];
        obj.pop=[];

        lifeFields.forEach(function(e,j){
            obj.life.push(parseFloat(d[e]))
            maxLife = Math.max(maxLife,parseFloat(d[e]))
        })

        popFields.forEach(function(e,j){
            obj.pop.push(parseFloat(d[e]))
            maxPop = Math.max(maxPop,parseFloat(d[e]))
        })

        gdpFields.forEach(function(e,j){
            obj.gdp.push(parseFloat(d[e]))
            maxGDP = Math.max(maxGDP,parseFloat(d[e]))
        })

        chartData.push(obj)

    })

    //sort the data so smaller circles will draw on top
    chartData.sort(function(x, y){
        return d3.descending(x.pop[config.index], y.pop[config.index]);
    })


    //put in background year counter if needed
     if (config.animate){

        plot.append("text")
            .attr("id","timeText")
            .attr("font-size",500)
            .attr("font-weight",500)
            .attr("text-anchor","middle")
            .attr("x",w/2)
            .attr("y",h*0.65)
            .attr("fill","#eeeeee")
            .text(years[config.index])


    }

    //data and max values all sorted, can now started to define scales


    var xScale;

    if (config.semilog==true){
        xScale = d3.scale.log()
        .domain([500,maxGDP])
        .range([0,plotWidth]);
    }   else  {
        xScale = d3.scale.linear()
        .domain([0,maxGDP])
        .range([0,plotWidth]);
    }



   

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .ticks(5)
        .tickSize(-plotHeight)
        .tickFormat(function (d) {
            return xScale.tickFormat(4,d3.format(",d"))(d)
        })
        .orient("bottom");

    plot.append("g")
        .attr("id","xAxis")
        .attr("class",media+"xAxis")
        .attr("transform","translate("+margin.left+","+(margin.top+plotHeight)+")")
        .call(xAxis)

    var yScale = d3.scale.linear()
        .domain([20,maxLife])
        .range([plotHeight,0])

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .ticks(4)
        .tickSize(-plotWidth)
        .orient("left")

    plot.append("g")
        .attr("id","yAxis")
        .attr("class",media+"yAxis")
        .attr("transform","translate("+margin.left+","+margin.top+")")
        .call(yAxis)


    //scale for circle size
    var zScale = d3.scale.sqrt()
        .domain([10000, maxPop])
        .range([2, config.maxCircle]);

    //extract region names for colour coding
    var regions = d3.map(data, function(d){return d.region;}).keys()
/*
    yellow = e5ff2f
    orange = ff982f
    green = 68ff5e
    dark blue = 3f4fff
    red = ff2f2f
    lightblue = 2fbfe5
*/
    var catColours = ["#154577","#58bdbb","#f9a71a","#aaaaaa"]
    var colScale = d3.scale.ordinal()
        .domain(regions)
        .range(catColours)

    //create key
    if (config.colour){
        var key = plot.append("g")
            .attr("id","key")
            .attr("transform","translate(1150,820)");

        key.selectAll("circle")
            .data(catColours)
            .enter()
            .append("circle")
            .attr("r",15)
            .attr("cy",function(d,i){
                return i*40
            })
            .attr("fill",function(d){return d})

        key.selectAll("text")
            .data(regions)
            .enter()
            .append("text")
            .attr("font-size","28px")
            .text(function(d){return d})
            .attr("x",22)
            .attr("y",function(d,i){
                return i*40+10
            })
            .attr("fill","#555")
    }

    if (config.scale){

        var scaleValues = [10000000,150000000,500000000]

        var scalekey = plot.append("g")
            .attr("id","sizekey")
            .attr("transform","translate(1450,885)");

        scalekey.selectAll("circle")
            .data(scaleValues)
            .enter()
            .append("circle")
            .attr("r",function(d){
                return zScale(d)
            })
            .attr("stroke","#555")
            .attr("stroke-width","1px")
            .attr("fill","none")
            .attr("cy",function(d){
                if (d==scaleValues[scaleValues.length-1]){
                    return 0;
                }   else    {
                    return (zScale(scaleValues[scaleValues.length-1]))-(zScale(d))
                }
            })

        scalekey.selectAll("line")
            .data(scaleValues)
            .enter()
            .append("line")
            .attr("stroke","#555")
            .attr("stroke-width","1px")
            .attr("fill","none")
            .attr("x1",0)
            .attr("x2",50)
            .attr("y1",function(d){
                 if (d==scaleValues[scaleValues.length-1]){
                    return -zScale(d);
                }   else    {
                    return (zScale(scaleValues[scaleValues.length-1]))-(zScale(d)*2)
                }
            })
            .attr("y2",function(d){
                 if (d==scaleValues[scaleValues.length-1]){
                    return -zScale(d);
                }   else    {
                    return (zScale(scaleValues[scaleValues.length-1]))-(zScale(d)*2)
                }
            })

        scalekey.selectAll("text")
            .data(scaleValues)
            .enter()
            .append("text")
            .attr("fill","#555")
            .attr("text-anchor","end")
            .attr("font-size","28px")
            .attr("x",140)
            .attr("y",function(d){
                 if (d==scaleValues[scaleValues.length-1]){
                    return -zScale(d)+5;
                }   else    {
                    return (zScale(scaleValues[scaleValues.length-1]))-(zScale(d)*2)+5
                }
            })
            .text(function(d){
                return d/1000000+"m";
            })

        scalekey.append("text")
            .attr("fill","#555")
            .attr("x",140)
            .attr("y",-100)
            .attr("text-anchor","end")
            .attr("font-size","28px")
            .text("POPULATION")

    }



    //titles and labels etc
    plot.append("text")
        .attr("x",w/2)
        .attr("y",h)
        .text("GDP per capita (PPP$, inflation-adjusted)")
        .attr("text-anchor","middle")
        .attr("fill","black")
        .attr("font-size","28px")

    //titles and labels etc
    plot.append("text")
        .attr("x",-500)
        .attr("y",30)
        .attr("transform","rotate(270)")
        .text("Life expectancy (years)")
        .attr("text-anchor","middle")
        .attr("fill","black")
        .attr("font-size","28px")


    //plot the data
    var circles = plot.append("g").attr("id","circles")
        .attr("transform","translate("+margin.left+","+margin.top+")");

    circles.selectAll("circle")
        .data(chartData)
        .enter()
        .append("circle")
        .attr("id",function(d){
            return d.name
        })
       .attr("r",function(d){
            if (config.scale==true){
                return zScale(d.pop[config.index])
            }   else    {
                return 4;
            }
            
        })
        .attr("fill",function(d,i){
            if (config.colour==true){
                return colScale(d.region)
            }   else{
                return colours[0]
            }
            
        })
        .attr("stroke","#fff")
        .attr("stroke-width","2px")
        .attr("cx",function(d,i){
            return xScale(d.gdp[config.index])
        })
        .attr("cy",function(d,i){
            return yScale(d.life[config.index])
        })

///*
    circles.selectAll("text")
        .data(chartData)
        .enter()
        .append("text")
        .attr("id",function(d){
            return "label"+d.name
        })
        .attr("x",function(d,i){
            return xScale(d.gdp[config.index])
        })
        .attr("y",function(d,i){
            console.log(d.label)
            if (d.label=="bottom"){
                if (config.scale==true){
                    return (yScale(d.life[config.index]) + zScale(d.pop[config.index]))+24
                }   else    {
                    return yScale(d.life[config.index])+24
                }
            }

            if (d.label=="top"){
                if (config.scale==true){
                    return (yScale(d.life[config.index]) - zScale(d.pop[config.index]))-8
                }   else    {
                    return yScale(d.life[config.index])-8
                }
            }



        })
        .text(function(d){
            return d.name
        })
        .attr("fill","#555")
        .attr("font-weight","bold")
        .attr("stroke","#ffffff")
        .attr("stroke-width","0.2px")
        .attr("text-anchor","middle")
        .attr("font-size","28px")



//*/

    if (config.animate){


        var timeout = setInterval(function(){

            if (config.index<years.length-1){
                config.index++
            }   else    {
                clearTimeout(timeout);
                //config.index=0;
            }

            //transition circles
            d3.select("#circles")
                .selectAll("circle")
                .transition()
                .duration(config.speed)
                .ease("linear-in-out")
                .attr("r",function(d){
                    if (config.scale==true){
                        return zScale(d.pop[config.index])
                    }   else    {
                        return 4;
                    }
                })
                .attr("cx",function(d,i){
                    return xScale(d.gdp[config.index])
                })
                .attr("cy",function(d,i){
                    return yScale(d.life[config.index])
                })

            //transition labels
            circles.selectAll("text")
                .transition()
                .duration(config.speed)
                .ease("linear-in-out")
                .attr("x",function(d,i){
                    return xScale(d.gdp[config.index])
                })
                .attr("y",function(d,i){

                    if (d.label=="bottom"){
                        if (config.scale==true){
                            return (yScale(d.life[config.index]) + zScale(d.pop[config.index]))+24
                        }   else    {
                            return yScale(d.life[config.index])+24
                        }
                    }

                    if (d.label=="top"){
                        if (config.scale==true){
                            return (yScale(d.life[config.index]) - zScale(d.pop[config.index]))-8
                        }   else    {
                            return yScale(d.life[config.index])-8
                        }
                    }

                })






                d3.select("#timeText").text(years[config.index])

        }, config.speed);

    }

    



}