import React from "react";
import { createChart } from "lightweight-charts";
import equal from "fast-deep-equal";

const addSeriesFunctions = {
    candlestick: "addCandlestickSeries",
    line: "addLineSeries",
    area: "addAreaSeries",
    bar: "addBarSeries",
    histogram: "addHistogramSeries"
};

const colors = [
    "#008FFB",
    "#00E396",
    "#FEB019",
    "#FF4560",
    "#775DD0",
    "#F86624",
    "#A5978B"
];

class ChartWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.chartDiv = React.createRef();
        this.chart = null;
        this.series = [];
    }

    componentDidMount() {
        this.chart = createChart(this.chartDiv.current);
        this.handleUpdateChart();
        this.resizeHandler();
    }

    componentDidUpdate(prevProps) {
        if (!this.props.autoWidth)
            window.removeEventListener("resize", this.resizeHandler);
        if (
            !equal(
                [
                    prevProps.onCrosshairMove,
                    prevProps.onTimeRangeMove,
                    prevProps.onClick
                ],
                [
                    this.props.onCrosshairMove,
                    this.props.onTimeRangeMove,
                    this.props.onClick
                ]
            )
        )
            this.unsubscribeEvents(prevProps);
        if (
            !equal(
                [
                    prevProps.options,
                    prevProps.candlestickSeries,
                    prevProps.lineSeries,
                    prevProps.areaSeries,
                    prevProps.barSeries,
                    prevProps.histogramSeries
                ],
                [
                    this.props.options,
                    this.props.candlestickSeries,
                    this.props.lineSeries,
                    this.props.areaSeries,
                    this.props.barSeries,
                    this.props.histogramSeries
                ]
            )
        ) {
            this.removeSeries();
            this.handleUpdateChart();
        } else if (
            prevProps.from !== this.props.from ||
            prevProps.to !== this.props.to
        )
            this.handleTimeRange();
    }

    resizeHandler = () => {
        let width =
            this.chartDiv.current &&
            this.chartDiv.current.parentNode.clientWidth;
        this.chart.resize(width, this.props.height || 500);
    };

    removeSeries = () => {
        this.series.forEach(serie => this.chart.removeSeries(serie));
        this.series = [];
    };

    addSeries = (serie, type) => {
        const func = addSeriesFunctions[type];
        const series = this.chart[func]({
            color: colors[this.series.length % colors.length],
            ...serie.options
        });
        series.setData(serie.data);
        if (serie.markers) series.setMarkers(serie.markers);
        if (serie.priceLines)
            serie.priceLines.forEach(line => series.createPriceLine(line));
        return series;
    };

    handleSeries = () => {
        let series = this.series;
        let props = this.props;
        props.candlestickSeries &&
            props.candlestickSeries.forEach(serie => {
                series.push(this.addSeries(serie, "candlestick"));
            });

        props.lineSeries &&
            props.lineSeries.forEach(serie => {
                series.push(this.addSeries(serie, "line"));
            });

        props.areaSeries &&
            props.areaSeries.forEach(serie => {
                series.push(this.addSeries(serie, "area"));
            });

        props.barSeries &&
            props.barSeries.forEach(serie => {
                series.push(this.addSeries(serie, "bar"));
            });

        props.histogramSeries &&
            props.histogramSeries.forEach(serie => {
                series.push(this.addSeries(serie, "histogram"));
            });
    };

    unsubscribeEvents = prevProps => {
        let chart = this.chart;
        chart.unsubscribeClick(prevProps.onClick);
        chart.unsubscribeCrosshairMove(prevProps.onCrosshairMove);
        chart.unsubscribeVisibleTimeRangeChange(prevProps.onTimeRangeMove);
    };

    handleEvents = () => {
        let chart = this.chart;
        let props = this.props;
        props.onClick && chart.subscribeClick(props.onClick);
        props.onCrosshairMove &&
            chart.subscribeCrosshairMove(props.onCrosshairMove);
        props.onTimeRangeMove &&
            chart.subscribeVisibleTimeRangeChange(props.onTimeRangeMove);
    };

    handleTimeRange = () => {
        let { from, to } = this.props;
        from && to && this.chart.timeScale().setVisibleRange({ from, to });
    };

    handleUpdateChart = () => {
        let { chart, chartDiv } = this;
        let props = this.props;
        let options = {
            width: props.autoWidth
                ? chartDiv.current.parentNode.clientWidth
                : props.width,
            height: props.height || 500,
            ...props.options
        };
        chart.applyOptions(options);

        this.handleSeries();
        this.handleEvents();
        this.handleTimeRange();

        if (props.autoWidth)
            // resize the chart with the window
            window.addEventListener("resize", this.resizeHandler);
    };

    render() {
        return (
            <React.Fragment>
                <div ref={this.chartDiv} />
            </React.Fragment>
        );
    }
}

export default ChartWrapper;