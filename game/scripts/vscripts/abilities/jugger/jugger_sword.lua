JuggerSword = class({}, nil, UnitEntity)

function JuggerSword:constructor(round, owner, target, particle)
    getbase(JuggerSword).constructor(self, round, DUMMY_UNIT, target, owner.unit:GetTeamNumber())

    self.owner = owner.owner
    self.hero = owner
    self.health = 1
    self.size = 64
    self.collisionType = COLLISION_TYPE_INFLICTOR

    local unit = self:GetUnit()
    unit.hero = self

    self.particle = ParticleManager:CreateParticle(particle, PATTACH_ABSORIGIN_FOLLOW, self.unit)
    self:SetPos(target)
    self:EmitSound("Arena.Jugger.SwordAppear")
end

function JuggerSword:Remove()
    getbase(JuggerSword).Remove(self)

    if self.hero:Alive() then
        self.hero:SwordOnLevelDestroyed()
        self.hero:StartSwordTimer()
    end

    ParticleManager:DestroyParticle(self.particle, false)
    ParticleManager:ReleaseParticleIndex(self.particle)
end

function JuggerSword:SetParticle(particle)
    if self.particle then
        ParticleManager:DestroyParticle(self.particle, true)
        ParticleManager:ReleaseParticleIndex(self.particle)
    end

    self.particle = ParticleManager:CreateParticle(particle, PATTACH_ABSORIGIN_FOLLOW, self.unit)
end

function JuggerSword:Damage(source)
end

function JuggerSword:CollidesWith(source)
    return source == self.hero
end

function JuggerSword:CollideWith(target)
    if target == self.hero then
        target:SwordPickedUp()
        self:EmitSound("Arena.Jugger.Pick")
        self:Destroy()
    end
end

function JuggerSword:CanFall(source)
    return true
end