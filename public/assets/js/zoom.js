  

  document.addEventListener('DOMContentLoaded', function() {
     const zoomScale = 2; // Adjust this value to change the zoom level
 
     function setupZoom(slickSlide) {
         const image = slickSlide.querySelector('img');
         let zoomResult = slickSlide.querySelector('.zoom-result');
         
         if (!zoomResult) {
             zoomResult = document.createElement('div');
             zoomResult.className = 'zoom-result';
             slickSlide.querySelector('.wrap-pic-w').appendChild(zoomResult);
         }
 
         function handleMouseEnter() {
             zoomResult.style.opacity = '1';
         }
 
         function handleMouseLeave() {
             zoomResult.style.opacity = '0';
         }
 
         function handleMouseMove(e) {
             const rect = image.getBoundingClientRect();
             const x = e.clientX - rect.left;
             const y = e.clientY - rect.top;
 
             const percentX = (x / rect.width) * 100;
             const percentY = (y / rect.height) * 100;
 
             zoomResult.style.backgroundImage = `url('${image.src}')`;
             zoomResult.style.backgroundSize = `${image.width * zoomScale}px ${image.height * zoomScale}px`;
             zoomResult.style.backgroundPosition = `${percentX}% ${percentY}%`;
         }
 
         image.addEventListener('mouseenter', handleMouseEnter);
         image.addEventListener('mouseleave', handleMouseLeave);
         image.addEventListener('mousemove', handleMouseMove);
     }
 
     // Setup zoom for initial slides
     document.querySelectorAll('.slick3 .item-slick3').forEach(setupZoom);
 
     // If you're using slick slider, you need to setup zoom after slide change
     // Uncomment and adjust the following lines if you're using slick slider
     
 //     $('.slick3').on('afterChange', function(event, slick, currentSlide) {
 // 	   setupZoom(slick.$slides[currentSlide]);
 //     });
     
 });