import numberFormatter from "../../util/number-formatter"
import React from "react"
import Money from "../behaviours/money"

export const VISITORS_METRIC = {
  name: 'visitors',
  label: 'Visitantes',
  realtimeLabel: 'Visitantes ativos',
  goalFilterLabel: 'Conversions',
  plot: true
}
export const PAGENAME_METRIC = { name: 'pagename', label: "Página", justifyMetric: false}
export const PAGEVIEW_METRIC = { name: 'pageviews', label: "Visualizações", hiddenOnMobile: true}
export const PERCENTAGE_METRIC = { name: 'percentage', label: '%' }
export const CR_METRIC = { name: 'conversion_rate', label: 'CR' }

export function maybeWithCR(metrics, query) {
  if (metrics.includes(PERCENTAGE_METRIC) && query.filters.goal) {
    return metrics.filter((m) => { return m !== PERCENTAGE_METRIC }).concat([CR_METRIC])
  }
  else if (query.filters.goal) {
    return metrics.concat(CR_METRIC)
  }
  else {
    return metrics
  }
}

export function displayMetricValue(value, metric) {
  if (['total_revenue', 'average_revenue'].includes(metric.name)) {
    return <Money formatted={value} />
  } else if (metric === PERCENTAGE_METRIC) {
    return value
  } else if (metric === CR_METRIC) {
    return `${value}%`
  } else {
    return <span className="truncate" tooltip={value}>{ numberFormatter(value) }</span>
  }
}

export function metricLabelFor(metric, query) {
  if (metric.realtimeLabel && query.period === 'realtime') { return metric.realtimeLabel }
  if (metric.goalFilterLabel && query.filters.goal) { return metric.goalFilterLabel }
  return metric.label
}