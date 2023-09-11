
// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite;

// create an engine
var engine = Engine.create();

// create a renderer
var canvas = document.getElementById('canvasFinal')
var render = Render.create({
    element: document.getElementById('game'),
    canvas: canvas,
    engine: engine
});
var context = document.getElementById('canvasFinal').getContext('2d')

var bubbles = []
function removeItem(item){
    var pos = bubbles.indexOf(item)
    if (pos>=0) bubbles.splice(pos,1)
    Matter.World.remove(engine.world, item);
}
function newItem(remove){
    console.log('newItem', remove!=null)
    if (remove) {
        removeItem(remove)
    }
    var boxA = Bodies.circle(Math.round(Math.random()*600), 0, 40,
        {
            category: 'bubble',
            airFriction: 0.0001,
            render: {
                sprite: {
                    texture: Math.random() > 0.7 ? 'bubbles2' : 'bubbles1'
                }
            }
        }
    );
    bubbles.push(boxA)
    Composite.add(engine.world, [boxA])
}
// create two boxes and a ground
newItem()

var images = {}
images['bubbles1'] = new Image()
images['bubbles1'].src = 'img/bubbles1.png'
images['bubbles2'] = new Image()
images['bubbles2'].src = 'img/bubbles2.png'
images['bubbles0'] = new Image()
images['bubbles0'].src = 'img/bubbles0.png'

var audio = document.getElementById('pop')

// add all of the bodies to the world
var collides = Matter.Query.collides;

function popit(item) {
    item.collided = true
    if (item.render.sprite.texture == 'bubbles2'){
        item.render.sprite.texture = 'bubbles1'
        audio.volume = 0.3
        audio.play()
        setTimeout((box)=>{
            item.collided = false
        },300,item)
        return
    }
    item.render.sprite.texture = 'bubbles0'
    audio.volume = 1.0
    audio.play()
    //console.log('collides',item)
    setTimeout((box)=>{
        removeItem(item)
    },100,item)
}

// run the engine
MotionDetector.init();
setInterval(newItem,500)
setTimeout(function(){
    (function run() {
        window.requestAnimationFrame(run);
        var items = MotionDetector.run();
        Composite.add(engine.world, items);
        Engine.update(engine, 1000 / 60);
        for(var idx1 in bubbles){
            var boxA = bubbles[idx1];
            if (!boxA.collided){
                var result = Matter.Query.region(items, boxA.bounds)
                if (result.length){
                    var item = boxA
                    popit(item)
                }
            }
            if (boxA.position.y>=500){
                newItem(boxA);
            }
        }
        setTimeout(()=>{
            for (var idx in items)
                Matter.World.remove(engine.world, items[idx])
        },200)
        var bodies = Composite.allBodies(engine.world);
        context.beginPath();
        for (var i = 0; i < bodies.length; i += 1) {
            var body = bodies[i]
            var vertices = bodies[i].vertices;
            if (body.hidden) continue;
            var border = true
            if (body.render && body.render.sprite && body.render.sprite.texture){
                var sp = body.render.sprite
                var r = body.circleRadius
                var img = images[sp.texture]
                if (img){
                    border = false
                    if (r){
                        context.drawImage(img,body.position.x-r, body.position.y-r, r*2,r*2)
                    }
                    else
                    context.drawImage(img,body.position.x-body.circleRadius, body.position.y-body.circleRadius)
                }
            } 
            if (border){
                context.moveTo(vertices[0].x, vertices[0].y);
                for (var j = 1; j < vertices.length; j += 1) {
                    context.lineTo(vertices[j].x, vertices[j].y);
                }
                context.lineTo(vertices[0].x, vertices[0].y);
            }
        }
        context.lineWidth = 1;
        context.strokeStyle = '#888';
        context.stroke();

    })();
},2000)

