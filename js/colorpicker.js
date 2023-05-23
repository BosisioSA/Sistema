const pickr1 = new Pickr({
    el: '#color-picker-1',
    default: "303030",
    components: {
      preview: true,
      opacity: true,
      hue: true,
  
      interaction: {
        hex: true,
        rgba: true,
        hsla: true,
        hsva: true,
        cmyk: true,
        input: true,
        clear: true,
        save: true
      }
    }
  });