(function () {

var
  D = Flotr.DOM,
  _ = Flotr._;

Flotr.addPlugin('legend', {
  options: {
    show: true,            // => setting to true will show the legend, hide otherwise
    noColumns: 1,          // => number of colums in legend table // @todo: doesn't work for HtmlText = false
    labelFormatter: function(v){return v;}, // => fn: string -> string
    labelBoxBorderColor: '#CCCCCC', // => border color for the little label boxes
    labelBoxWidth: 14,
    labelBoxHeight: 10,
    labelBoxMargin: 5,
    container: null,       // => container (as jQuery object) to put legend in, null means default on top of graph
    position: 'nw',        // => position of default legend container within plot
    margin: 5,             // => distance from grid edge to default legend container within plot
    backgroundColor: '#F0F0F0', // => Legend background color.
    backgroundOpacity: 0.85, // => set to 0 to avoid background, set to 1 for a solid background
    onLegendClick: null,
  },
  callbacks: {
    'flotr:afterinit': function() {
      this.legend.insertLegend();
    },
    'flotr:destroy': function() {
      var markup = this.legend.markup;
      if (markup) {
        this.legend.markup = null;
        D.remove(markup);
      }
    }
  },
  /**
   * Adds a legend div to the canvas container or draws it on the canvas.
   */
  insertLegend: function(){

    if(!this.options.legend.show)
      return;

    var series      = this.series,
      plotOffset    = this.plotOffset,
      options       = this.options,
      legend        = options.legend,
      fragments     = [],
      rowStarted    = false,
      ctx           = this.ctx,
      itemCount     = series.length,
      p             = legend.position,
      m             = legend.margin,
      opacity       = legend.backgroundOpacity,
      i, label, color,
      graph         = this;

    if (itemCount) {

      var lbw = legend.labelBoxWidth,
          lbh = legend.labelBoxHeight,
          lbm = legend.labelBoxMargin,
          offsetX = plotOffset.left + m,
          offsetY = plotOffset.top + m,
          labelMaxWidth = 0,
          style = {
            size: options.fontSize*1.1,
            color: options.grid.color
          };

      // We calculate the labels' max width
      for(i = series.length - 1; i > -1; --i){
        label = legend.labelFormatter(series[i].label);
        labelMaxWidth = Math.max(labelMaxWidth, this._text.measureText(label, style).width);
      }

      var legendWidth  = Math.round(lbw + lbm*3 + labelMaxWidth),
          legendHeight = Math.round(itemCount*(lbm+lbh) + lbm);

      // Default Opacity
      if (!opacity && opacity !== 0) {
        opacity = 0.1;
      }

      if (!options.HtmlText && this.textEnabled && !legend.container) {

        if(p.charAt(0) == 's') offsetY = plotOffset.top + this.plotHeight - (m + legendHeight);
        if(p.charAt(0) == 'c') offsetY = plotOffset.top + (this.plotHeight/2) - (m + (legendHeight/2));
        if(p.charAt(1) == 'e') offsetX = plotOffset.left + this.plotWidth - (m + legendWidth);

        // Legend box
        color = this.processColor(legend.backgroundColor, { opacity : opacity });

        ctx.fillStyle = color;
        ctx.fillRect(offsetX, offsetY, legendWidth, legendHeight);
        ctx.strokeStyle = legend.labelBoxBorderColor;
        ctx.strokeRect(Flotr.toPixel(offsetX), Flotr.toPixel(offsetY), legendWidth, legendHeight);

        // Legend labels
        var x = offsetX + lbm;
        var y = offsetY + lbm;
        for(i = 0; i < series.length; i++){
          label = legend.labelFormatter(series[i].label);

          ctx.fillStyle = series[i].color;
          ctx.fillRect(x, y, lbw-1, lbh-1);

          ctx.strokeStyle = legend.labelBoxBorderColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(Math.ceil(x)-1.5, Math.ceil(y)-1.5, lbw+2, lbh+2);

          // Legend text
          Flotr.drawText(ctx, label, x + lbw + lbm, y + lbh, style);

          y += lbh + lbm;
        }
      } else {
        var legendClicked = function() {
          var me = this;
          setTimeout(function() {
            me.callback(me.series, me.idx);
          }, 1);
        };

        if (!_.isFunction(legend.onLegendClick)) {
          legend.onLegendClick = null;
        }

        for(i = 0; i < series.length; ++i) {

          var trEl = document.createElement('tr');

          fragments.push(trEl);

          var s = series[i],
            boxWidth = legend.labelBoxWidth,
            boxHeight = legend.labelBoxHeight;

          label = legend.labelFormatter(s.label);
          color = (
            (s.bars && s.bars.show && s.bars.fillColor && s.bars.fill) ?
            s.bars.fillColor : s.color
          );

          if (legend.onLegendClick !== null) {
            trEl.classList.add('clickable');
            trEl.onclick = legendClicked.bind({
              idx: i,
              series: series[i],
              callback: legend.onLegendClick,
            });
          }
          if (s.hide === true) {
            color = 'transparent';
          }

          trEl.innerHTML = [
            '<td class="flotr-legend-color-box">',
            ' <div style="border: 1px solid ', legend.labelBoxBorderColor, '">',
            '  <div style="width:', (boxWidth - 1), 'px;',
            '   height: ', (boxHeight - 1), 'px;',
            '   border: 1px solid ', series[i].color, '">', // Border
            '   <div class="flotr-legend-color-bg" style="',
            '    width:', boxWidth, 'px; height:', boxHeight, 'px;',
            '    background-color:', color, ';"> </div>', // Background
            '  </div>',
            ' </div>',
            '</td>',
            '<td class="flotr-legend-label">', label, '</td>',
          ].join('');
        }

        if(fragments.length > 0) {
          var table,
            tblStyle = [
              'font-size: smaller',
              'color:' + options.grid.color,
            ].join(';');

          if(legend.container) {
            table = document.createElement('table');
            table.style = tblStyle;
            this.legend.markup = table;
            D.insert(legend.container, table);
          } else {
            table = '<table style="' + tblStyle + '"></table>';
            var styles = {
              position: 'absolute', 'zIndex': '2',
              'border' : '1px solid ' + legend.labelBoxBorderColor
            };

            if(p.charAt(0) == 'n') { styles.top = (m + plotOffset.top) + 'px'; styles.bottom = 'auto'; }
            else if(p.charAt(0) == 'c') { styles.top = (m + (this.plotHeight - legendHeight) / 2) + 'px'; styles.bottom = 'auto'; }
            else if(p.charAt(0) == 's') { styles.bottom = (m + plotOffset.bottom) + 'px'; styles.top = 'auto'; }
            if(p.charAt(1) == 'e') { styles.right = (m + plotOffset.right) + 'px'; styles.left = 'auto'; }
            else if(p.charAt(1) == 'w') { styles.left = (m + plotOffset.left) + 'px'; styles.right = 'auto'; }

            var div = D.create('div'), size;
            div.className = 'flotr-legend';
            D.setStyles(div, styles);
            table = D.node(table);
            D.insert(div, table);
            D.insert(this.el, div);

            if (!opacity) return;

            var c = legend.backgroundColor || options.grid.backgroundColor || '#ffffff';

            _.extend(styles, {
              'backgroundColor': c,
              'zIndex' : '',
              'border' : '',
              'top': 0,
              'bottom': 0,
              'right': 0,
              'left': 0,
            });

            // Put in the transparent background separately to avoid blended
            // labels and colors.
            var legend_bg = D.create('div');
            legend_bg.className = 'flotr-legend-bg';
            D.setStyles(legend_bg, styles);
            D.opacity(legend_bg, 0.25 * opacity);
            div.firstChild ? div.insertBefore(legend_bg, div.firstChild) :
              div.appendChild(legend_bg);
          }

          for(i = 0; i < fragments.length; i++) {
            table.appendChild(fragments[i]);
          }
        }
      }
    }
  }
});
})();
