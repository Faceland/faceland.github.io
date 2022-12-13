import React, {useEffect, useState} from "react";
import p5 from "p5";

let loopLayers = [];
let imageCache = [];

export const ImageRenderer = ({canvas, layers}) => {

  const [sketchInstance, setSketchInstance] = useState()
  let throttle = false;

  useEffect(() => {
    console.log('[IMAGE RENDERER (PROBABLY) MOUNTED]')
    setSketchInstance(new p5(sketch))
  }, []);

  useEffect(() => {
    if (!sketchInstance) return
    console.log("[LAYER CHANGE DETECTED]")
    loopLayers = [...layers]
  }, [layers]);

  const sketch = (s) => {
    s.setup = () => {
      console.log("[BUILDING CANVAS]")
      const p5Canvas = s.createCanvas(canvas.width, canvas.height)
      setTimeout(() => {
        p5Canvas.parent("canvas-container");
      }, 50);
    }
    s.draw = () => {
      renderImages(s, loopLayers)
    }
  }

  const cacheImages = (s, layers) => {
    layers.map((layer, index) => {
      if (layer.texture && !getImage(layer.texture)) {
        s.loadImage(
          layer.texture,
          (img) => {
            console.log("[CACHED NEW IMAGE]")
            imageCache[layer.texture] = img
          },
          (event) => {
            console.warn("[FAILED TO LOAD IMAGE - " + layer.texture + "]")
            console.warn(event)
          });
      }
    })
  }

  const getImage = (id) => {
    return imageCache[id];
  }

  const renderImages = (s, layers) => {
    if (throttle) return;
    throttle = true
    setTimeout(() => {
      throttle = false;
    }, 50);
    cacheImages(s, layers)
    s.clear()
    const loopArray = [...layers].reverse()
    loopArray.map((layer, index) => {
      const image = getImage(layer.texture)
      if (image) {
        applyTint(s, layer.color)
        s.image(image, 0, 0)
      }
    })
  }

  const applyTint = (s, tint) => {
    if (Array.isArray(tint)) {
      const [a, b, c, d] = tint
      return s.tint(a, b, c, d)
    } else if (
      typeof tint === 'object' &&
      ('color' in tint || 'alpha' in tint)
    ) {
      return s.tint(tint.color, tint.alpha)
    } else if (typeof tint === 'string') {
      return s.tint(tint)
    } else return s.tint('white')
  }

  return (
    <div id="canvas-container" className="pixelImage"/>
  )
}