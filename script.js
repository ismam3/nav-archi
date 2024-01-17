import * as THREE from "./three/build/three.module.js";
import {OrbitControls} from "./three/examples/jsm/controls/OrbitControls.js"
import {GLTFLoader} from "./three/examples/jsm/loaders/GLTFLoader.js"

// data structures 
let stationIndex = []
let waterplaneIndex = []
let offsetData = []
let tdpoints = []
let negtdpoints = []
let lnpoints = []
let keelpoints = []
let waterplaneHeights = []
let stationLengths = []
let primaryDimensions = []
let stern = []
let neg_stern = []
let bow = []
let neg_bow = []


// excel reading 
var reader = new FileReader();

const input = document.getElementById('input')
const bs = document.getElementById('bs')
const submit = document.getElementById("submit")

//changing placeholder after uploading file
input.addEventListener("change",()=>{
  document.getElementById("shower_btn").innerHTML = input.files[0].name
})
bs.addEventListener("change",()=>{
  document.getElementById("shower_btn_bs").innerHTML = bs.files[0].name
  var bs_reader = new FileReader();
  bs_reader.readAsText(bs.files[0])
  bs_reader.onload = (event)=>{
    let bsdata = event.target.result
    let rowData = bsdata.split("\r\n")
    for(var r = 0;r<rowData.length;r++){
      var coldata = rowData[r].split(",")
      var bow_x = coldata[2]
      var stern_x = coldata[1]
      var vs_wp = coldata[0]
      bow.push({x:parseFloat(bow_x),y:0,z:parseFloat(vs_wp)})
      stern.push({x:stern_x,y:0,z:vs_wp})
      neg_stern.push({x:stern_x,y:0,z:vs_wp})
      neg_bow.push({x:parseFloat(bow_x),y:0,z:parseFloat(vs_wp)})
      // negtdpoints.push({x:stern_x,y:0,z:vs_wp})
    }
  }
})

submit.addEventListener('click', () => {
  document.getElementById("workspace").style.display = 'flex'
  let lbp = parseFloat(document.getElementById("lbp").value)
  let b = parseFloat(document.getElementById("b").value)
  let depth = parseFloat(document.getElementById("d").value)
  primaryDimensions = [lbp, b, depth]
  if(input.files.length == 0){
    // throw "Doesn't provide offset table"
    alert("Please provide an offset table")
    location.reload()

  }
  reader.readAsText(input.files[0])
  if (isNaN(lbp) || isNaN(b) || isNaN(depth)) {
    alert("Please Give LBP, breadth and depth propoerly")
    location.reload()
  } else {
    reader.onload=(event)=>{
      console.log("Offset loaded")
      document.getElementById("init_gui_container").style.display="none";
      // document.getElementById("linesplan").style.display="block";
      var csvdata = event.target.result
      var rowData = csvdata.split("\r\n")
      var wpRow = rowData[0].split(",")
      wpRow.shift()
      waterplaneIndex.push(wpRow)
      const wl_spacing = depth/waterplaneIndex[0][waterplaneIndex[0].length-1]
      for(var r = 1;r<rowData.length;r++){
        var coldata = rowData[r].split(",")
        stationIndex.push(coldata[0])
        coldata.shift()
        offsetData.push(coldata) 
      }
      for(var s=0;s<stationIndex.length;s++){
        stationLengths.push(lbp - (parseInt(stationIndex[s])*(lbp/20)))
      }
      for(var p = 0;p<offsetData.length;p++){
        for(var o = 0;o<offsetData[p].length;o++){
          var xd = lbp - stationIndex[p]*(lbp/20);
          var yd = parseFloat(offsetData[p][o])*b/2;
          var zd = parseFloat(waterplaneIndex[0][o])*wl_spacing;
          if(p==0){
            waterplaneHeights.push(zd)
          }
          if(p==offsetData.length-2){
            stern.push({x:xd,y:yd,z:zd})
          }
          if(p==1){
            bow.push({x:xd,y:yd,z:zd})
            neg_bow.push({x:xd,y:yd*-1,z:zd})
          }
          if(xd!=NaN||yd!=NaN||zd!=NaN){
            if(zd==0){
              if(p>0&&p<=offsetData.length-2){
                keelpoints.push({x:xd,y:yd,z:zd})
              }
            }
            if(bs.files.length!=0){
              if(p<offsetData.length-1&&p>0){
                tdpoints.push({x:xd,y:yd,z:zd})
              }
            }
            else{
              tdpoints.push({x:xd,y:yd,z:zd})
            }
            lnpoints.push({x:xd,y:yd,z:zd})
          }
          
        }
        for(var o = 0;o<offsetData[p].length;o++){
          var xd = lbp - stationIndex[p]*(lbp/20);
          var yd = parseFloat(offsetData[p][o])*-1*b/2;
          var zd = parseFloat(waterplaneIndex[0][o])*wl_spacing;
          if(xd!=NaN||yd!=NaN||zd!=NaN){
            if(zd==0){
              if(p>0&&p<=offsetData.length-2){
                keelpoints.push({x:xd,y:yd,z:zd})
              }
            }
            if(bs.files.length!=0){
              if(p<offsetData.length-1&&p>0){
                negtdpoints.push({x:xd,y:yd,z:zd})
              }
            }
            else{
              negtdpoints.push({x:xd,y:yd,z:zd})
            }
            
          }
          if(p==offsetData.length-2){
            neg_stern.push({x:xd,y:yd,z:zd})
          }
          
        }
      }
      rend(tdpoints,negtdpoints,keelpoints, stern, neg_stern, bow, neg_bow)
    } 
  }
   
})



function rend(point,negpoint,keelpoints, stern, neg_stern, bow, neg_bow){
  console.log(point)
  var canvas = document.getElementById('threed');
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, -35, 1, 1000);
  camera.position.set(150 , 50 , 0);
  var renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas:canvas
  });

  scene.background = new THREE.Color( "#555555" );


  var controls = new OrbitControls(camera, canvas);

  var light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set(0,0,-30);
  scene.add(light);
  var light1 = new THREE.DirectionalLight(0xffffff, 1);
  light1.position.set(30,10,0);
  scene.add(light1);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  

  var geom = new THREE.BufferGeometry().setFromPoints(point);
  var neg_geom = new THREE.BufferGeometry().setFromPoints(negpoint);
  var keel_geom = new THREE.BufferGeometry().setFromPoints(keelpoints);
  var stern_geom = new THREE.BufferGeometry().setFromPoints(stern);
  var neg_stern_geom = new THREE.BufferGeometry().setFromPoints(neg_stern);
  var bow_geom = new THREE.BufferGeometry().setFromPoints(bow);
  var neg_bow_geom = new THREE.BufferGeometry().setFromPoints(neg_bow);
  // var cloud = new THREE.Points(
  //   geom,
  //   new THREE.PointsMaterial({ color: 0x99ccff, size: 0.2 })
  // );
  // var neg_cloud = new THREE.Points(
  //   neg_geom,
  //   new THREE.PointsMaterial({ color: 0x99ccff, size: 0.2 })
  // );
  // var keel_cloud = new THREE.Points(
  //   keel_geom,
  //   new THREE.PointsMaterial({ color: 0x99ccff, size: 0.2 })
  // );
  // var stern_cloud = new THREE.Points(
  //   stern_geom,
  //   new THREE.PointsMaterial({ color: 0x99ccff, size: 0.2 })
  // ); 

  // cloud.rotation.set(-Math.PI/2 , 0 , 0);
  // neg_cloud.rotation.set(-Math.PI/2 , 0 , 0);
  // keel_cloud.rotation.set(-Math.PI/2 , 0 , 0);
  // stern_cloud.rotation.set(-Math.PI/2 , 0 , 0);
  // cloud.position.set(-100/2 , 0 , 0) //100 - lbp
  // neg_cloud.position.set(-100/2 , 0 , 0) //100 - lbp
  // keel_cloud.position.set(-100/2 , 0 , 0) //100 - lbp
  // stern_cloud.position.set(-100/2 , 0 , 0) //100 - lbp

  // scene.add(cloud);
  // scene.add(neg_cloud);
  // scene.add(keel_cloud)
  // scene.add(stern_cloud)

  // triangulate x, z
  var indexDelaunay = Delaunator.from(
    point.map(v => {
      return [v.x, v.z];
    })
  );
  var neg_indexDelaunay = Delaunator.from(
    negpoint.map(v => {
      return [v.x, v.z];
    })
  );
  var keel_indexDelaunay = Delaunator.from(
    keelpoints.map(v => {
      return [v.x, v.y];
    })
  );


  if(bs.files.length!=0){
    var stern_indexDelaunay = Delaunator.from(
      stern.map(v => {
        return [v.x, v.y];
      })
    );
    var neg_stern_indexDelaunay = Delaunator.from(
      neg_stern.map(v => {
        return [v.x, v.y];
      })
    );
    var bow_indexDelaunay = Delaunator.from(
      bow.map(v => {
        return [v.x, v.y];
      })
    );
    var neg_bow_indexDelaunay = Delaunator.from(
      neg_bow.map(v => {
        return [v.x, v.y];
      })
    );
    var sternmeshIndex = []; // delaunay index => three.js index
    for (let i = 0; i < stern_indexDelaunay.triangles.length; i++){
      sternmeshIndex.push(stern_indexDelaunay.triangles[i]);
    }
    var neg_sternmeshIndex = []; // delaunay index => three.js index
    for (let i = 0; i < neg_stern_indexDelaunay.triangles.length; i++){
      neg_sternmeshIndex.push(stern_indexDelaunay.triangles[i]);
    }
    var bowmeshIndex = []; // delaunay index => three.js index
    for (let i = 0; i < bow_indexDelaunay.triangles.length; i++){
      bowmeshIndex.push(bow_indexDelaunay.triangles[i]);
    }
    var neg_bowmeshIndex = []; // delaunay index => three.js index
    for (let i = 0; i < neg_bow_indexDelaunay.triangles.length; i++){
      neg_bowmeshIndex.push(neg_bow_indexDelaunay.triangles[i]);
    }
    stern_geom.setIndex(sternmeshIndex)
    neg_stern_geom.setIndex(neg_sternmeshIndex)
    bow_geom.setIndex(bowmeshIndex)
    neg_bow_geom.setIndex(neg_bowmeshIndex)
    stern_geom.computeVertexNormals();
    neg_stern_geom.computeVertexNormals();
    bow_geom.computeVertexNormals();
    neg_bow_geom.computeVertexNormals();
    var stern_mesh = new THREE.Mesh(
      stern_geom, // re-use the existing geometry
      new THREE.MeshLambertMaterial({ color: "blue", wireframe: false, side:THREE.DoubleSide })
    );
    var neg_stern_mesh = new THREE.Mesh(
      neg_stern_geom, // re-use the existing geometry
      new THREE.MeshLambertMaterial({ color: "blue", wireframe: false, side:THREE.DoubleSide })
    );
    var bow_mesh = new THREE.Mesh(
      bow_geom, // re-use the existing geometry
      new THREE.MeshLambertMaterial({ color: "blue", wireframe: false, side:THREE.DoubleSide })
    );
    var neg_bow_mesh = new THREE.Mesh(
      neg_bow_geom, // re-use the existing geometry
      new THREE.MeshLambertMaterial({ color: "blue", wireframe: false, side:THREE.DoubleSide })
    );
    stern_mesh.rotation.set(-Math.PI/2,0,0);
    neg_stern_mesh.rotation.set(-Math.PI/2,0,0);
    bow_mesh.rotation.set(-Math.PI/2,0,0);
    neg_bow_mesh.rotation.set(-Math.PI/2,0,0);
    stern_mesh.position.set(-100/2 , 0 , 0) //100 - lbp
    neg_stern_mesh.position.set(-100/2 , 0 , 0) //100 - lbp
    bow_mesh.position.set(-100/2 , 0 , 0) //100 - lbp
    neg_bow_mesh.position.set(-100/2 , 0 , 0) //100 - lbp
    scene.add(stern_mesh);
    scene.add(neg_stern_mesh);
    scene.add(bow_mesh);
    scene.add(neg_bow_mesh);
  }



  var meshIndex = []; // delaunay index => three.js index
  for (let i = 0; i < indexDelaunay.triangles.length; i++){
    meshIndex.push(indexDelaunay.triangles[i]);
  }
  var negmeshIndex = []; // delaunay index => three.js index
  for (let i = 0; i < neg_indexDelaunay.triangles.length; i++){
    negmeshIndex.push(indexDelaunay.triangles[i]);
  }
  var keelmeshIndex = []; // delaunay index => three.js index
  for (let i = 0; i < keel_indexDelaunay.triangles.length; i++){
    keelmeshIndex.push(keel_indexDelaunay.triangles[i]);
  }

  geom.setIndex(meshIndex); // add three.js index to the existing geometry
  neg_geom.setIndex(negmeshIndex)
  keel_geom.setIndex(keelmeshIndex)

  geom.computeVertexNormals();
  neg_geom.computeVertexNormals();
  keel_geom.computeVertexNormals();

  var mesh = new THREE.Mesh(
    geom, // re-use the existing geometry
    new THREE.MeshLambertMaterial({ color: "blue", wireframe: false, side:THREE.DoubleSide })
  );
  var neg_mesh = new THREE.Mesh(
    neg_geom, // re-use the existing geometry
    new THREE.MeshLambertMaterial({ color: "blue", wireframe: false, side:THREE.DoubleSide })
  );
  var keel_mesh = new THREE.Mesh(
    keel_geom, // re-use the existing geometry
    new THREE.MeshLambertMaterial({ color: "blue", wireframe: false, side:THREE.DoubleSide })
  );
  

  mesh.rotation.set(-Math.PI/2,0,0);
  neg_mesh.rotation.set(-Math.PI/2,0,0);
  keel_mesh.rotation.set(-Math.PI/2,0,0);

  mesh.position.set(-100/2 , 0 , 0) //100 - lbp
  neg_mesh.position.set(-100/2 , 0 , 0) //100 - lbp
  keel_mesh.position.set(-100/2 , 0 , 0) //100 - lbp


  scene.add(mesh);
  scene.add(neg_mesh);
  scene.add(keel_mesh);


  // var gui = new dat.GUI();
  // gui.add(mesh.material, "wireframe");
  const gridHelper = new THREE.GridHelper(400, 200 , "#000" ,"#676A6A");
  gridHelper.position.set(0,-0.5,0)

scene.add( gridHelper );

render();

function resize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}
linesplan_gn()
function render() {
  if (resize(renderer)) {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
}



function linesplan_gn(){
  console.log(tdpoints)
  var waterpls = []
  for(var i = 0;i<waterplaneHeights.length;i++){
    const waterpl=[]
    for(var j = 0;j<lnpoints.length;j++){ 
      if(lnpoints[j].z==waterplaneHeights[i]){
        waterpl.push(new THREE.Vector2( lnpoints[j].x, lnpoints[j].y ))
      }
    }
    waterpls.push(waterpl)
  }

  var bdls = []
  for(var i=0;i<stationLengths.length;i++){
    const bdl =[]
    for(var j = 0;j<lnpoints.length;j++){
      if(lnpoints[j].x==stationLengths[i]){
        if(stationIndex[i]<=10){
          bdl.push(new THREE.Vector2( lnpoints[j].y, lnpoints[j].z))
        }
        else{
          bdl.push(new THREE.Vector2( lnpoints[j].y*-1, lnpoints[j].z))
        }  
      }
    }
    bdls.push(bdl)
  }

  var width = document.getElementById("half-breadth").clientWidth;
  var height = document.getElementById("half-breadth").clientHeight;
  var hbcanvas = document.getElementById("half-breadth");
  var bdcanvas = document.getElementById("bodyplan");
  var pfcanvas = document.getElementById("profile");
  var scene = new THREE.Scene();
  var bdscene = new THREE.Scene();
  var pfscene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 );
  var bdcamera = new THREE.PerspectiveCamera(60, width/height, 0.1, 1000);
  var pfcamera = new THREE.PerspectiveCamera(60, width/height, 0.1, 1000);
  camera.position.set(primaryDimensions[0]/2, 0 , 80);
  bdcamera.position.set(0 , primaryDimensions[2]/2 , 10);
  pfcamera.position.set(50, 0, 50);
  var renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas:hbcanvas,
    alpha:true
  });
  var bdRenderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas:bdcanvas,
    alpha:true
  })
  var pfRenderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas:pfcanvas,
    alpha:true
  })
  renderer.setSize(width,height);
  bdRenderer.setSize(width,height);
  pfRenderer.setSize(width,height);
  scene.background = new THREE.Color( "#ffffff" );
  bdscene.background = new THREE.Color( "#ffffff" );
  pfscene.background = new THREE.Color( "#ffffff" );

  // var controls = new OrbitControls(camera, canvas);

  var light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.setScalar(100);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  var curvePoints = []
  var material = new THREE.LineBasicMaterial( { color: 0x000000} );
  var colorArray = [0x000000,0xff0000,0x00ff00,0x0000ff,0xffff00,0x00ffff,0xf0f0f0,0xff0ff0,0x0f0f0f,0xfff000,0x000fff]
  for(var w=0;w<waterpls.length;w++){
    const curve = new THREE.SplineCurve(waterpls[w])

    const points = curve.getPoints( 10000 );
    curvePoints.push(points)
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const splineObject = new THREE.Line( geometry, new THREE.LineBasicMaterial({color:colorArray[w]}) );
    scene.add(splineObject)
  }
  const line_geometry = new THREE.BufferGeometry().setFromPoints( [new THREE.Vector3( 0, 3.5, 0 ), new THREE.Vector3( 100, 3.5, 0 )] );
  for(var s = 0;s<stationLengths.length;s++){
    const curve = new THREE.SplineCurve(bdls[s])
    const points = curve.getPoints( 50 );
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const splineObject = new THREE.Line( geometry, material );
    bdscene.add(splineObject)
  }
  var profile = []
  var btIndexes = [primaryDimensions[2]/10,primaryDimensions[2]/8,primaryDimensions[2]/6,primaryDimensions[2]/4]
  for(var i=0;i<btIndexes.length;i++){
    var ind = profilePoints(parseFloat(btIndexes[i]))
    profile.push(ind[0])
    profile.push(ind[1])
  }

  for(var j = 0;j<profile.length;j++){
    const curve = new THREE.SplineCurve(profile[j])

    const points = curve.getPoints( 200 );
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const splineObject = new THREE.Line( geometry, material );
    pfscene.add(splineObject)
  }
  hbcanvas.addEventListener("scroll",()=>{
    console.log(camera)
  })

  function profilePoints(bt){
    var foreProfile = []
    var aftProfile = []
    for(var z = 0;z<curvePoints.length;z++){
      var x_points = []
      for(var a = 0;a<curvePoints[z].length;a++){
        if(curvePoints[z][a].y.toFixed(2)-bt<0.01&&curvePoints[z][a].y.toFixed(2)-bt>-0.01){
          var xx = curvePoints[z][a].x
          x_points.push(xx.toFixed(2))
        }
      }
      if(x_points.length==2){
        for(var i =0;i<x_points.length;i++){
          if(x_points[i]<primaryDimensions[0]/2){
            foreProfile.push(parseFloat(x_points[i]))
          }
          else{
            aftProfile.push(parseFloat(x_points[i]))
          }
        }
      }
      else{
        var aft = []
        var fore = []
        for(var i =0;i<x_points.length;i++){
          if(x_points[i]<primaryDimensions[0]/2){
            fore.push(x_points[i])
          }
          else{
            aft.push(x_points[i])
          }
        }
        var foreSum = 0
        for(var j =0;j<fore.length;j++){
          foreSum = foreSum + parseFloat(fore[j])
        }
        foreProfile.push(foreSum/fore.length)

        var aftSum = 0
        for(var j =0;j<aft.length;j++){
          aftSum = aftSum + parseFloat(aft[j])
        }
        aftProfile.push(aftSum/aft.length)
      }
    }
    var foreProfileIndexes = []
    for(var i = 0; i<foreProfile.length;i++){
      foreProfileIndexes.push(new THREE.Vector2(foreProfile[i], waterplaneHeights[i]))
    }
    var aftProfileIndexes = []
    for(var i = 0; i<aftProfile.length;i++){
      aftProfileIndexes.push(new THREE.Vector2(aftProfile[i], waterplaneHeights[i]))
    }
    return [foreProfileIndexes,aftProfileIndexes]
  }
  // const pfcurve = new THREE.SplineCurve(foreProfileIndexes)

  //   const points = pfcurve.getPoints( 200 );
  //   const geometry = new THREE.BufferGeometry().setFromPoints( points );
  //   const splineObject = new THREE.Line( geometry, material );
  //   pfscene.add(splineObject)

  // Create the final object to add to the scene
  
  var pfcontrols = new OrbitControls(pfcamera, pfcanvas)
  pfcontrols.enableRotate = false
  pfcontrols.target.set(50,0,0)
pfcontrols.update()
var wlcontrols = new OrbitControls(camera,hbcanvas)
  wlcontrols.enableRotate = false
  wlcontrols.target.set(50,0,0)
wlcontrols.update()
  render();

  function render() {
    requestAnimationFrame( render);
	// pfcontrols.update();
    renderer.render(scene, camera);
    bdRenderer.render(bdscene, bdcamera)
    pfRenderer.render(pfscene, pfcamera)
  }
}

      