import React from "react";
import p5 from "p5";
/**
  A React component that uses Processing to apply image processing filter.
  Provides a better abstraction for dealing with RGB values and alpha channel in images
  Applies the RGB and alpha transparency and returns a new canvas
*/
export class ImageTint extends React.Component {

  // Render the sketch and return a new canvas displaying the edited image
  renderSketch = pObj => {
    const { tint, src, canvas } = this.props
    console.log("rendeR??2")
    const dispatch = fns => {
      fns.forEach(fn => {
        if (typeof fn !== undefined && typeof fn === 'function') {
          pObj[fn.name] = fn
        } else {
          console.warn(
            `Expected a function, got ${typeof fn} instead. Refere to P5.js documentation for more information`
          )
        }
      })
    }

    // Start Processing
    console.log("rendeR??7")
    this.renderImage(pObj, dispatch, tint, src, canvas)
  }

  // Apply the various types of values feeded to 'tint' prop
  applyTintValues = (processing, tint) => {
    console.log("rendeR??6")
    if (Array.isArray(tint)) {
      const [a, b, c, d] = tint
      return processing.tint(a, b, c, d)
    } else if (
      typeof tint === 'object' &&
      ('color' in tint || 'alpha' in tint)
    ) {
      return processing.tint(tint.color, tint.alpha)
    } else if (typeof tint === 'string') {
      return processing.tint(tint)
    } else return processing.tint('white')
  }

  // Processing core
  renderImage = (
    processing,
    dispatch,
    tint,
    src,
    { height, width, renderer }
  ) => {
    let img
    console.log("rendeR??3")
    // Load the image from the src (Called once)
    let preload = () => {
      img = processing.loadImage(src)
    }

    // Called once when the image is loaded
    let setup = () => {
      processing.createCanvas(width, height, processing.P2D)
      this.applyTintValues(processing, tint)
      processing.image(img, 0, 0)
    }

    // Start Processing (dispatch all the processing functions)
    dispatch([preload, setup])
  }

  // Returns the new canvas
  getCanvas = () => new p5(this.renderSketch, this.wrapper)

  componentDidMount = () => this.getCanvas()

  render() {
    const { canvas, src, tint, ...rest } = this.props
    console.log("rendeR??1")
    return <div ref={wrapper => (this.wrapper = wrapper)} {...rest} />
  }
}