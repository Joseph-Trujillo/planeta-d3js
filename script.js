const width = window.innerWidth;
const height = window.innerHeight;
let rotation = [50,0]
let connections = []
let selectedCountries = []

const colors = {
    backCountries: "#aaa",
    frontCountries: "#000",
    selectedCountries: "#0a0",
    strokeCountries: "#fff",
    graticule: "#555",

    hoverCountries: '#00a',

    connection: '#a00'
}


const svg = d3.select('body')
    .append('svg')
    .attr('height', height)
    .attr('width', width)

const frontProjection = d3.geoOrthographic()
    .scale(height / 2.5)
    .translate([width / 2, height / 2])
    .rotate(rotation)
    .clipAngle(90)

const backProjection = d3.geoOrthographic()
    .scale(height / 2.5)
    .translate([width / 2, height / 2])
    .rotate(rotation)
    .clipAngle(180)

const frontPath = d3.geoPath(frontProjection)
const backPath = d3.geoPath(backProjection)

const globe = svg.append('g')
const graticule = d3.geoGraticule()

d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(worldData => {
    const countries = topojson.feature(worldData, worldData.objects.countries)

    globe.append('g')
        .selectAll('.back-countries')
        .data(countries.features)
        .enter().append('path')
        .attr('d', backPath)
        .attr('class', 'back-countries')
        .attr('fill', colors.backCountries)
        .attr('stroke', colors.strokeCountries)
        .attr('opacity', .3)
        .attr('stroke-width', .4)

    globe.append('path')
        .datum(graticule())
        .attr('d', backPath)
        .attr('class', 'back-graticule')
        .attr('fill', 'none')
        .attr('stroke', colors.graticule)
        .attr('stroke-width', .4)


    globe.append('g')
        .selectAll('.front-countries')
        .data(countries.features)
        .enter().append('path')
        .attr('d', frontPath)
        .attr('class', 'front-countries')
        .attr('fill', colors.frontCountries)
        .attr('stroke', colors.strokeCountries)
        .attr('stroke-width', .4)
        .on('mouseover', hoverIn)
        .on('mouseout', hoverOut)
        .on('click', handleClickCountry)

    globe.append('path')
        .datum(graticule())
        .attr('d', frontPath)
        .attr('class', 'front-graticule')
        .attr('fill', 'none')
        .attr('stroke', colors.graticule)
        .attr('stroke-width', .4)

})


const hoverIn = (event)=>{
    d3.select(event.target)
        .attr('fill', colors.hoverCountries)
}

const hoverOut = (event)=>{
    d3.select(event.target)
        .attr('fill', colors.frontCountries)
}

const zoom = d3.zoom()
    .scaleExtent([.5, 5])
    .on('zoom', (event)=>{
        console.log(event)
        const transform = event.transform

        frontProjection.scale((height / 2.5) * transform.k)
        backProjection.scale((height / 2.5) * transform.k)

        const sensitivity = .25
        rotation[0] += event.sourceEvent.movementX * sensitivity
        rotation[1] -= event.sourceEvent.movementY * sensitivity

        frontProjection.rotate(rotation)
        backProjection.rotate(rotation)

        redraw()
    })


svg.call(zoom)


const redraw = ()=>{
    globe.selectAll('.back-countries').attr('d', backPath)
    globe.selectAll('.front-countries').attr('d', frontPath)

    globe.selectAll('.back-graticule').attr('d', backPath)
    globe.selectAll('.front-graticule').attr('d', frontPath)

    drawConnections()

}


const drawConnections = ()=>{
    globe.selectAll('.connection').remove()

    connections.forEach(({source, target}) =>{
        const arc = d3.geoInterpolate(source, target)
        const points = d3.range(0, 1.01, .2).map(arc)

        globe.append('path')
            .datum({type:'LineString', coordinates: points})
            .attr('d', frontPath)
            .attr('class', 'connection')
            .attr('fill', 'none')
            .attr('stroke', colors.connection)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5.5')

    })
}


const handleClickCountry =(event, d)=>{
    const country = d
    console.log(event)

    if(selectedCountries.includes(country)){
        selectedCountries = selectedCountries.filter(c => c !== country)
        d3.select(event.target).attr('fill', colors.frontCountries)
    }else{
        selectedCountries.push(country)
        d3.select(event.target).attr('fill', colors.selectedCountries)
    }

    if(selectedCountries.length == 2){
        const [source, target] = selectedCountries.map(c =>{
            return d3.geoCentroid(c)
        })
        
        connections.push({source,target})
        selectedCountries =[]
        drawConnections()
    }
}