<script lang="ts">
  import { onMount } from 'svelte';
  import { createChart, CandlestickSeries, HistogramSeries, ColorType, type IChartApi } from 'lightweight-charts';
  let { candles = [] }: { candles: any[] } = $props();
  let container: HTMLDivElement;
  let chart: IChartApi;
  let series: any;
  let volume: any;
  onMount(() => {
    chart = createChart(container, { autoSize:true, layout:{background:{type:ColorType.Solid,color:'#11151c'},textColor:'#748091',fontFamily:'Arial'}, grid:{vertLines:{color:'#1a2029'},horzLines:{color:'#1a2029'}}, rightPriceScale:{borderColor:'#242b35'},timeScale:{borderColor:'#242b35',timeVisible:true},crosshair:{vertLine:{color:'#8791a1'},horzLine:{color:'#8791a1'}} });
    series = chart.addSeries(CandlestickSeries,{upColor:'#4cbd9a',downColor:'#ec7781',borderVisible:false,wickUpColor:'#4cbd9a',wickDownColor:'#ec7781'});
    volume = chart.addSeries(HistogramSeries,{priceFormat:{type:'volume'},priceScaleId:'volume'});
    chart.priceScale('volume').applyOptions({scaleMargins:{top:0.82,bottom:0}});
    update();
    return () => chart.remove();
  });
  function update(){if(!series)return;series.setData(candles.map(c=>({time:c.time,open:c.open,high:c.high,low:c.low,close:c.close})));volume.setData(candles.map(c=>({time:c.time,value:c.volume,color:c.close>=c.open?'#4cbd9a30':'#ec778130'})));chart.timeScale().fitContent();}
  $effect(()=>{candles;update();});
</script>
<div class="chart-canvas" bind:this={container}></div>
<style>.chart-canvas{width:100%;height:100%;min-height:300px}</style>
