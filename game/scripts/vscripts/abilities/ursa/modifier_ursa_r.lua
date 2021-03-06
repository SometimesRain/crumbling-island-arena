modifier_ursa_r = class({})

function modifier_ursa_r:DeclareFunctions()
    local funcs = {
        MODIFIER_PROPERTY_MODEL_SCALE
    }

    return funcs
end

function modifier_ursa_r:CheckState()
    local state = {
        [MODIFIER_STATE_MAGIC_IMMUNE] = true
    }

    return state
end

function modifier_ursa_r:GetModifierModelScale()
    return 30
end

function modifier_ursa_r:GetStatusEffectName()
    return "particles/status_fx/status_effect_beserkers_call.vpcf"
end

function modifier_ursa_r:StatusEffectPriority()
    return 10
end

function modifier_ursa_r:GetEffectName()
    return "particles/units/heroes/hero_ursa/ursa_enrage_buff.vpcf"
end

function modifier_ursa_r:GetEffectAttachType()
    return PATTACH_ABSORIGIN_FOLLOW
end
