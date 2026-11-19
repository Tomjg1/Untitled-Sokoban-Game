# TODO
Project demos December 3rd. 

## Tasks Rordon 
### Animation
- [ ] Animation for crates/enemies falling in water. 
- [ ] Player/NPC death animation with function to trigger and reset it. 
- [ ] Smooth turning for goblins to look at player. 

### Graphics 
- [ ] Finalize water shader. 
  - [ ] Add refraction with noise texture. 
- [ ] Exit/goal tile effect. (light circle or something...) 
- [ ] Adjustable fog effect for level transitions. 
  - [ ] Variable in game state object to control effect 0 - 1. 
- [ ] Build scene for level 0. (.blend file)
- [ ] Build scene for level 1. 
- [ ] Build scene for level 2. 
- [ ] Build scene for level 3. 
- [ ] Camera perspective switching. 

## Tasks Thomas
- [ ] create level 0 map layout.
- [ ] Smooth Level transitions with fog.
### Gameplay 
- [ ] Parse level .txt files.
- [ ] Player input and not going into water or walls.
- [ ] Player exit logic (move to next level).
    - [ ] Function for Rordo to get position of goal tile.
    - [ ] Adding array of level data like obj files and camera positions.
- [ ] Undo logic.
    - [ ] Hook into animation.
- [ ] Pushing objects (creates/NPCs).
- [ ] Crates falling into water and then walkable.
    - [ ] Hook into rordos animation system.
- [ ] Smooth Level transitions with fog.
- [ ] Goblins (kill player if directly up/down/left/right, safe on diagonals).
    - [ ] Hook into animation system for player/goblin death.
### Strech Gameplay 
- [ ] Goblins killing eachother
- [ ] Wall tile that dissapears when all goblins are dead. 
