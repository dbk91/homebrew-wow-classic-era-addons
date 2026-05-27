cask "questie" do
  version "11.28.0"
  sha256 "addc4595fe87f8e6b541d463e22fa2392b1e0d639e6db9fa01dd8c9e10ab2525"

  url "https://github.com/Questie/Questie/releases/download/v#{version}/Questie-v#{version}.zip"
  name "Questie"
  desc "Questie: The WoW Classic quest helper"
  homepage "https://github.com/Questie/Questie"

  addon_dir = File.expand_path("/Applications/World of Warcraft/_classic_era_/Interface/AddOns")

  preflight do
    FileUtils.mkdir_p addon_dir unless Dir.exist?(addon_dir)
  end

  artifact "Questie", target: "#{addon_dir}/Questie"

  zap trash: [
    "#{addon_dir}/Questie"
  ]
end
