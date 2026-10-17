(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  $('#year').textContent = new Date().getFullYear();
  const menuToggle = $('#menuToggle'), nav = $('#mainNav');
  menuToggle.addEventListener('click', () => { const open = nav.classList.toggle('open'); menuToggle.setAttribute('aria-expanded', String(open)); });
  $$('#mainNav a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menuToggle.setAttribute('aria-expanded','false'); }));

  // Reveal content as it enters view, with a graceful fallback for older browsers.
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), {threshold:.08});
    revealEls.forEach(el => observer.observe(el));
  } else revealEls.forEach(el => el.classList.add('visible'));

  // The roadmap's active node follows the section currently in view.
  const sections = ['home','about','skills','projects','journey','contact'].map(id => document.getElementById(id)).filter(Boolean);
  const nodes = $$('.road-node');
  const navLinks = $$('#mainNav a');
  function activate(id){
    nodes.forEach(n => n.classList.toggle('selected', n.dataset.section === id));
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#'+id));
  }
  nodes.forEach(node => node.addEventListener('click', e => { const id=node.dataset.section; const target=document.getElementById(id); if(target){e.preventDefault(); activate(id); target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}); history.replaceState(null,'','#'+id);} }));
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => { const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0]; if(visible) activate(visible.target.id); }, {rootMargin:'-22% 0px -52% 0px',threshold:[0,.1,.25,.5]});
    sections.forEach(section=>sectionObserver.observe(section));
  }

  // Interactive Three.js microcontroller: slow auto-rotation, pointer tilt and a soft signal pulse.
  const stage = $('#threeStage');
  if (stage && window.THREE && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    try {
      const THREE = window.THREE;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, stage.clientWidth/stage.clientHeight, .1, 100);
      camera.position.set(0, 1.2, 7.5);
      const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
      renderer.setSize(stage.clientWidth, stage.clientHeight); renderer.setClearColor(0x000000,0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      stage.innerHTML=''; stage.appendChild(renderer.domElement);
      scene.add(new THREE.AmbientLight(0x9cff9d,1.8));
      const keyLight=new THREE.PointLight(0x9bff68,20,20);keyLight.position.set(3,4,5);scene.add(keyLight);
      const rimLight=new THREE.PointLight(0x36bb68,15,18);rimLight.position.set(-4,-1,2);scene.add(rimLight);
      const boardMat=new THREE.MeshStandardMaterial({color:0x14231a,metalness:.65,roughness:.3});
      const chipMat=new THREE.MeshStandardMaterial({color:0x070a08,metalness:.75,roughness:.22});
      const greenMat=new THREE.MeshStandardMaterial({color:0xa7ff68,emissive:0x2d8520,emissiveIntensity:1.1,metalness:.25,roughness:.25});
      const board=new THREE.Group();scene.add(board);
      const pcb=new THREE.Mesh(new THREE.BoxGeometry(3.5,.18,2.65),boardMat);board.add(pcb);
      const chip=new THREE.Mesh(new THREE.BoxGeometry(1.18,.24,1.12),chipMat);chip.position.y=.2;board.add(chip);
      const chipTop=new THREE.Mesh(new THREE.BoxGeometry(.9,.04,.84),new THREE.MeshStandardMaterial({color:0x18251b,metalness:.5,roughness:.3}));chipTop.position.y=.34;board.add(chipTop);
      // Fine luminous pin rows around the central IC.
      for(let i=0;i<8;i++){
        const z=-.48+i*.14;
        for(const x of [-.72,.72]){const pin=new THREE.Mesh(new THREE.BoxGeometry(.26,.035,.045),greenMat);pin.position.set(x,.19,z);board.add(pin);}
        const x=-.48+i*.137;
        for(const zSide of [-.69,.69]){const pin=new THREE.Mesh(new THREE.BoxGeometry(.045,.035,.23),greenMat);pin.position.set(x,.19,zSide);board.add(pin);}
      }
      // PCB trace runs, built from thin segments on the top plane.
      function trace(points, material=greenMat){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],.105,p[1])));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,32,.018,5,false),material);board.add(mesh);}
      const traceMat=new THREE.MeshStandardMaterial({color:0x4c9b55,emissive:0x174c20,emissiveIntensity:.8,metalness:.4,roughness:.35});
      trace([[-1.5,-.9],[-1,-.9],[-.8,-.6],[-.7,-.6]],traceMat);trace([[1.5,.9],[1,.9],[.85,.55],[.72,.55]],traceMat);trace([[-1.6,.4],[-1.1,.4],[-.9,.2],[-.72,.2]],traceMat);trace([[1.55,-.4],[1.2,-.4],[1,-.2],[.72,-.2]],traceMat);
      // Small capacitor/resistor packages.
      for(let i=0;i<7;i++){const box=new THREE.Mesh(new THREE.BoxGeometry(.22,.13,.16),i%2?chipMat:boardMat);box.position.set(-1.25+(i%4)*.72,.13,(i<4?-.95:.95));board.add(box);const cap=new THREE.Mesh(new THREE.BoxGeometry(.13,.015,.09),greenMat);cap.position.set(box.position.x,.205,box.position.z);board.add(cap);}
      // Orbiting data point and a subtle ring.
      const ring=new THREE.Mesh(new THREE.TorusGeometry(2.45,.012,5,120),new THREE.MeshBasicMaterial({color:0x427e48,transparent:true,opacity:.65}));ring.rotation.x=Math.PI/2.35;board.add(ring);
      const dot=new THREE.Mesh(new THREE.SphereGeometry(.065,16,16),greenMat);board.add(dot);
      const grid=new THREE.GridHelper(9,24,0x315a36,0x1b3020);grid.position.y=-.55;grid.material.transparent=true;grid.material.opacity=.25;scene.add(grid);
      let mx=0,my=0,rx=0,ry=0; stage.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();mx=((e.clientX-r.left)/r.width-.5)*.8;my=((e.clientY-r.top)/r.height-.5)*.45;});
      stage.addEventListener('pointerleave',()=>{mx=0;my=0;});
      let frame=0;
      function animate(){requestAnimationFrame(animate);frame+=.012;rx+=(my-rx)*.035;ry+=(mx-ry)*.035;board.rotation.x=.22+rx;board.rotation.y=frame*.22+ry;board.rotation.z=Math.sin(frame*.6)*.045;dot.position.set(Math.cos(frame*1.15)*2.45,.15,Math.sin(frame*1.15)*1.5);renderer.render(scene,camera);}
      animate();
      const resize=()=>{const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);};
      if('ResizeObserver' in window)new ResizeObserver(resize).observe(stage);else window.addEventListener('resize',resize);
    } catch(err) { console.warn('3D scene fallback enabled:',err); }
  }
})();
